import Anthropic from "@anthropic-ai/sdk";

import {
  getDatabaseProvider,
  getRequiredWriteDatabaseEnvKeys,
  updateNewsRowBySlug,
} from "@/lib/database";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { queryPostgres } from "@/lib/postgres";
import { toErrorMessage, withRetry } from "@/lib/runtime";

const MAX_CURATED_ITEMS = 5;

type TodayNewsRow = {
  slug: string;
  title_en: string;
  summary_en: string;
  tags: string[];
};

function getTodayMidnightUTC(): string {
  const now = new Date();
  const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return midnight.toISOString();
}

async function fetchTodayActiveNewsFromSupabase(todayMidnight: string): Promise<TodayNewsRow[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("news")
    .select("slug, locales, tags")
    .eq("is_active", true)
    .gte("published_at", todayMidnight)
    .order("published_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row: Record<string, unknown>) => {
    const locales = row.locales as Record<string, Record<string, string>>;
    return {
      slug: row.slug as string,
      title_en: locales?.en?.title ?? "",
      summary_en: locales?.en?.summary ?? "",
      tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    };
  });
}

async function fetchTodayActiveNewsFromPostgres(todayMidnight: string): Promise<TodayNewsRow[]> {
  const { rows } = await queryPostgres<Record<string, unknown>>(
    "select slug, locales, tags from public.news where is_active = true and published_at >= $1 order by published_at desc",
    [todayMidnight],
  );

  return rows.map((row) => {
    const locales = row.locales as Record<string, Record<string, string>>;
    return {
      slug: row.slug as string,
      title_en: locales?.en?.title ?? "",
      summary_en: locales?.en?.summary ?? "",
      tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    };
  });
}

async function fetchTodayActiveNews(todayMidnight: string): Promise<TodayNewsRow[]> {
  return getDatabaseProvider() === "postgres"
    ? fetchTodayActiveNewsFromPostgres(todayMidnight)
    : fetchTodayActiveNewsFromSupabase(todayMidnight);
}

function buildCurationPrompt(newsItems: TodayNewsRow[]): string {
  const itemsList = newsItems
    .map(
      (item, index) =>
        `${index + 1}. slug: "${item.slug}"\n   title: "${item.title_en}"\n   summary: "${item.summary_en}"\n   tags: [${item.tags.join(", ")}]`,
    )
    .join("\n\n");

  return `You are a senior data engineering editor curating a daily news feed. Your audience is data engineers, analytics engineers, and technical decision-makers.

Here are ALL the news items published today (${newsItems.length} total):

${itemsList}

TASK:
Select the TOP ${MAX_CURATED_ITEMS} most important items. Rank them by:
1. Trending relevance -- is this topic gaining momentum in the data engineering community?
2. Business impact -- does this affect how teams build, operate, or invest in data infrastructure?
3. Data engineering relevance -- how directly does this relate to data engineering practices?

RULES:
- Return EXACTLY ${MAX_CURATED_ITEMS} slugs (or fewer if there are fewer than ${MAX_CURATED_ITEMS} items)
- Order from most important to least important
- Do NOT add any slugs that are not in the list above

FORMAT your response as a JSON array of slug strings:
["slug-1", "slug-2", "slug-3", "slug-4", "slug-5"]

Return ONLY the JSON array, no markdown fences or extra text.`;
}

function parseCurationResponse(response: string): string[] {
  const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const parsed = JSON.parse(cleaned) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error("Curation response is not an array");
  }

  const slugs = parsed.filter((item): item is string => typeof item === "string");

  if (slugs.length === 0) {
    throw new Error("Curation response returned zero valid slugs");
  }

  return slugs;
}

async function main(): Promise<void> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const missingDatabaseEnv = getRequiredWriteDatabaseEnvKeys().filter((key) => !process.env[key]);

  if (missingDatabaseEnv.length > 0) {
    console.error(`ERROR: Missing required database env vars: ${missingDatabaseEnv.join(", ")}`);
    process.exit(1);
  }

  if (!anthropicKey) {
    console.error("ERROR: ANTHROPIC_API_KEY must be set");
    process.exit(1);
  }

  const todayMidnight = getTodayMidnightUTC();
  const todayNews = await fetchTodayActiveNews(todayMidnight);

  if (todayNews.length <= MAX_CURATED_ITEMS) {
    console.log(`Only ${todayNews.length} active items for today. No curation needed.`);
    return;
  }

  console.log(`Found ${todayNews.length} active news items for today. Curating top ${MAX_CURATED_ITEMS}.`);

  const anthropic = new Anthropic({ apiKey: anthropicKey });
  const prompt = buildCurationPrompt(todayNews);

  const message = await withRetry(
    () =>
      anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 512,
        messages: [{ role: "user", content: prompt }],
      }),
    {
      attempts: 3,
      delayMs: 1_500,
      shouldRetry: (error) => {
        const msg = toErrorMessage(error);
        return msg.includes("rate") || msg.includes("overloaded") || msg.includes("timeout") || msg.includes("529");
      },
      onRetry: (error, attempt, nextDelayMs) => {
        console.warn(`Retrying Claude curation after attempt ${attempt}: ${toErrorMessage(error)} (next in ${nextDelayMs}ms)`);
      },
    },
  );

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    console.error("ERROR: No text in Claude curation response");
    process.exit(1);
  }

  const keptSlugs = parseCurationResponse(textBlock.text);
  const validKeptSlugs = keptSlugs.filter((slug) =>
    todayNews.some((item) => item.slug === slug),
  );

  if (validKeptSlugs.length === 0) {
    console.error("ERROR: Claude returned no valid slugs matching today's news");
    process.exit(1);
  }

  const keptSet = new Set(validKeptSlugs);
  const toDeactivate = todayNews.filter((item) => !keptSet.has(item.slug));

  let deactivated = 0;
  for (const item of toDeactivate) {
    try {
      await withRetry(
        () => updateNewsRowBySlug(item.slug, { is_active: false }),
        {
          attempts: 3,
          delayMs: 500,
          shouldRetry: (error) => toErrorMessage(error).length > 0,
        },
      );
      deactivated += 1;
    } catch (updateError: unknown) {
      console.warn(`SKIPPED deactivation: ${item.slug} -- ${toErrorMessage(updateError)}`);
    }
  }

  console.log(`CURATED: kept ${validKeptSlugs.length}/${todayNews.length} items active for today`);
  console.log(`Deactivated ${deactivated} items`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
