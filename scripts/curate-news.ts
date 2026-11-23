import { Type, type Schema } from "@google/genai";
import { jsonrepair } from "jsonrepair";

import {
  getRequiredWriteDatabaseEnvKeys,
  updateNewsRowBySlug,
} from "@/lib/database";
import { generateText, resolveLlmProvider } from "@/lib/llm-text";
import { queryPostgres } from "@/lib/postgres";
import { toErrorMessage, withRetry } from "@/lib/runtime";

const CURATION_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    slugs: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["slugs"],
};

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

async function fetchTodayActiveNews(todayMidnight: string): Promise<TodayNewsRow[]> {
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

FORMAT your response as a JSON object with a "slugs" key containing an array of slug strings:
{"slugs": ["slug-1", "slug-2", "slug-3", "slug-4", "slug-5"]}

Return ONLY the JSON object, no markdown fences or extra text.`;
}

function parseCurationResponse(response: string): string[] {
  const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    parsed = JSON.parse(jsonrepair(cleaned));
  }

  // Accept either a raw array of slugs or an object with a "slugs" field.
  // OpenAI-compat json_object mode (Groq) requires a root-level object so
  // we ask for {"slugs": [...]} and unwrap here.
  let candidates: unknown[];
  if (Array.isArray(parsed)) {
    candidates = parsed;
  } else if (parsed && typeof parsed === "object" && Array.isArray((parsed as { slugs?: unknown }).slugs)) {
    candidates = (parsed as { slugs: unknown[] }).slugs;
  } else {
    throw new Error("Curation response is not an array or object with slugs field");
  }

  const slugs = candidates.filter((item): item is string => typeof item === "string");

  if (slugs.length === 0) {
    throw new Error("Curation response returned zero valid slugs");
  }

  return slugs;
}

async function main(): Promise<void> {
  const missingDatabaseEnv = getRequiredWriteDatabaseEnvKeys().filter((key) => !process.env[key]);

  if (missingDatabaseEnv.length > 0) {
    console.error(`ERROR: Missing required database env vars: ${missingDatabaseEnv.join(", ")}`);
    process.exit(1);
  }

  let provider;
  try {
    provider = resolveLlmProvider();
  } catch (error) {
    console.error(`ERROR: ${toErrorMessage(error)}`);
    process.exit(1);
  }
  console.log(`Using LLM provider: ${provider}`);

  const todayMidnight = getTodayMidnightUTC();
  const todayNews = await fetchTodayActiveNews(todayMidnight);

  if (todayNews.length <= MAX_CURATED_ITEMS) {
    console.log(`Only ${todayNews.length} active items for today. No curation needed.`);
    return;
  }

  console.log(`Found ${todayNews.length} active news items for today. Curating top ${MAX_CURATED_ITEMS}.`);

  const prompt = buildCurationPrompt(todayNews);

  const result = await withRetry(
    () => generateText({ prompt, maxTokens: 512, responseSchema: CURATION_SCHEMA }),
    {
      attempts: 3,
      delayMs: 1_500,
      shouldRetry: (error) => {
        const msg = toErrorMessage(error);
        return msg.includes("rate") || msg.includes("overloaded") || msg.includes("timeout") || msg.includes("529");
      },
      onRetry: (error, attempt, nextDelayMs) => {
        console.warn(`Retrying curation after attempt ${attempt}: ${toErrorMessage(error)} (next in ${nextDelayMs}ms)`);
      },
    },
  );

  const keptSlugs = parseCurationResponse(result.text);
  const validKeptSlugs = keptSlugs.filter((slug) =>
    todayNews.some((item) => item.slug === slug),
  );

  if (validKeptSlugs.length === 0) {
    console.error("ERROR: the LLM returned no valid slugs matching today's news");
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
