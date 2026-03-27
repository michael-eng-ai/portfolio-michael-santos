import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

import { toErrorMessage, withRetry } from "@/lib/runtime";

const MAX_ITEMS_PER_RUN = 5;

type NewsRow = {
  slug: string;
  source_name: string;
  source_url: string;
  tags: string[];
  locales: {
    en: { title: string; summary: string; whyItMatters: string };
    pt: { title: string; summary: string; whyItMatters: string };
  };
};

type EditorialAnalysis = {
  en: string;
  pt: string;
};

function buildPrompt(news: NewsRow): string {
  return `You are a senior data engineering consultant writing a brief editorial analysis about a news item. Your audience is data engineers, analytics engineers, and technical decision-makers.

NEWS ITEM:
- Title: ${news.locales.en.title}
- Source: ${news.source_name}
- Summary: ${news.locales.en.summary}
- Why it matters: ${news.locales.en.whyItMatters}
- Tags: ${news.tags.join(", ")}
- Original URL: ${news.source_url}

INSTRUCTIONS:
Write TWO versions of an editorial analysis (150-200 words each):

1. ENGLISH version: A concise, opinionated analysis covering:
   - What this means for data engineering teams in practice
   - Architectural or operational implications
   - How this connects to broader industry trends
   - A concrete takeaway or recommendation

2. PORTUGUESE (Brazilian) version: Same analysis translated naturally into Brazilian Portuguese. Not a literal translation -- adapt idioms and tone for a Brazilian tech audience.

RULES:
- Write in first person as a practicing data engineer sharing insights
- Be specific and practical, not generic
- Reference real technologies and patterns when relevant
- No bullet points -- write flowing paragraphs
- No introductory phrases like "This article discusses..." -- jump straight into the analysis
- Do NOT reproduce content from the original article -- write original analysis

FORMAT your response as JSON:
{"en": "English analysis here...", "pt": "Portuguese analysis here..."}

Return ONLY the JSON object, no markdown fences or extra text.`;
}

function parseAnalysis(response: string): EditorialAnalysis {
  const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const parsed = JSON.parse(cleaned) as EditorialAnalysis;

  if (!parsed.en || !parsed.pt) {
    throw new Error("Missing en or pt field in editorial analysis");
  }

  return { en: parsed.en, pt: parsed.pt };
}

async function main(): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
    process.exit(1);
  }

  if (!anthropicKey) {
    console.error("ERROR: ANTHROPIC_API_KEY must be set");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const anthropic = new Anthropic({ apiKey: anthropicKey });

  const { data: unenriched, error: fetchError } = await supabase
    .from("news")
    .select("slug, source_name, source_url, tags, locales")
    .is("editorial_analysis", null)
    .eq("is_active", true)
    .order("published_at", { ascending: true })
    .limit(MAX_ITEMS_PER_RUN);

  if (fetchError) {
    console.error("ERROR: failed to query unenriched news", fetchError.message);
    process.exit(1);
  }

  if (!unenriched || unenriched.length === 0) {
    console.log("All news items already enriched. Nothing to do.");
    return;
  }

  console.log(`Found ${unenriched.length} news items to enrich`);

  let enriched = 0;

  for (const row of unenriched) {
    const news = row as NewsRow;
    const prompt = buildPrompt(news);

    try {
      const message = await withRetry(
        () =>
          anthropic.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 1024,
            messages: [{ role: "user", content: prompt }],
          }),
        {
          attempts: 3,
          delayMs: 1_500,
          shouldRetry: (error) => {
            const message = toErrorMessage(error);
            return message.includes("rate") || message.includes("overloaded") || message.includes("timeout") || message.includes("529");
          },
          onRetry: (error, attempt, nextDelayMs) => {
            console.warn(`Retrying Claude enrichment for ${news.slug} after attempt ${attempt}: ${toErrorMessage(error)} (next in ${nextDelayMs}ms)`);
          },
        },
      );

      const textBlock = message.content.find((block) => block.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        console.warn(`SKIPPED: ${news.slug} -- no text in response`);
        continue;
      }

      const analysis = parseAnalysis(textBlock.text);

      const { error: updateError } = await withRetry(
        async () =>
          await supabase
            .from("news")
            .update({ editorial_analysis: analysis })
            .eq("slug", news.slug),
        {
          attempts: 3,
          delayMs: 500,
          shouldRetry: (error) => toErrorMessage(error).length > 0,
        },
      );

      if (updateError) {
        console.warn(`SKIPPED: ${news.slug} -- Supabase update failed: ${updateError.message}`);
        continue;
      }

      console.log(`ENRICHED: ${news.slug} (en: ${analysis.en.length} chars, pt: ${analysis.pt.length} chars)`);
      enriched += 1;
    } catch (enrichError: unknown) {
      const message = toErrorMessage(enrichError);
      console.warn(`SKIPPED: ${news.slug} -- ${message}`);
    }
  }

  console.log(`SUCCESS: ${enriched}/${unenriched.length} news items enriched`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
