import { Type, type Schema } from "@google/genai";
import { jsonrepair } from "jsonrepair";

import {
  getRequiredWriteDatabaseEnvKeys,
  listUnenrichedNewsRows,
  updateNewsRowBySlug,
} from "@/lib/database";
import { generateText, resolveLlmProvider } from "@/lib/llm-text";
import { toErrorMessage, withRetry } from "@/lib/runtime";

const ENRICHMENT_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    en: { type: Type.STRING },
    pt: { type: Type.STRING },
    seo_title_en: { type: Type.STRING },
    seo_title_pt: { type: Type.STRING },
    seo_description_en: { type: Type.STRING },
    seo_description_pt: { type: Type.STRING },
  },
  required: ["en", "pt"],
};

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
  seo_title_en?: string;
  seo_title_pt?: string;
  seo_description_en?: string;
  seo_description_pt?: string;
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

ALSO generate SEO-optimized metadata for search engines:
- seo_title_en: A compelling, click-worthy title (max 55 chars). NOT the original title -- rewrite it to spark curiosity or highlight the practical impact. Use power words like "Why", "How", "What Changes", "The Real Impact". Example: "Why Agent Context Layers Change Data Trust Forever"
- seo_title_pt: Same approach in Brazilian Portuguese (max 55 chars)
- seo_description_en: A compelling meta description (max 155 chars) that makes someone WANT to click. Include a concrete benefit or surprising insight. End with an implicit call to action.
- seo_description_pt: Same in Brazilian Portuguese (max 155 chars)

FORMAT your response as JSON:
{"en": "English analysis...", "pt": "Portuguese analysis...", "seo_title_en": "...", "seo_title_pt": "...", "seo_description_en": "...", "seo_description_pt": "..."}

Return ONLY the JSON object, no markdown fences or extra text.`;
}

function parseAnalysis(response: string): EditorialAnalysis {
  const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  let parsed: EditorialAnalysis;
  try {
    parsed = JSON.parse(cleaned) as EditorialAnalysis;
  } catch {
    parsed = JSON.parse(jsonrepair(cleaned)) as EditorialAnalysis;
  }

  if (!parsed.en || !parsed.pt) {
    throw new Error("Missing en or pt field in editorial analysis");
  }

  return {
    en: parsed.en,
    pt: parsed.pt,
    seo_title_en: parsed.seo_title_en,
    seo_title_pt: parsed.seo_title_pt,
    seo_description_en: parsed.seo_description_en,
    seo_description_pt: parsed.seo_description_pt,
  };
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

  const unenriched = await listUnenrichedNewsRows(MAX_ITEMS_PER_RUN);

  if (!unenriched || unenriched.length === 0) {
    console.log("All news items already enriched. Nothing to do.");
    return;
  }

  console.log(`Found ${unenriched.length} news items to enrich`);

  let enriched = 0;

  for (const row of unenriched) {
    const news = row as unknown as NewsRow;
    const prompt = buildPrompt(news);

    try {
      const result = await withRetry(
        () => generateText({ prompt, maxTokens: 1024, responseSchema: ENRICHMENT_SCHEMA }),
        {
          attempts: 3,
          delayMs: 1_500,
          shouldRetry: (error) => {
            const message = toErrorMessage(error);
            return message.includes("rate") || message.includes("overloaded") || message.includes("timeout") || message.includes("529");
          },
          onRetry: (error, attempt, nextDelayMs) => {
            console.warn(`Retrying enrichment for ${news.slug} after attempt ${attempt}: ${toErrorMessage(error)} (next in ${nextDelayMs}ms)`);
          },
        },
      );

      const analysis = parseAnalysis(result.text);

      await withRetry(
        () => updateNewsRowBySlug(news.slug, { editorial_analysis: analysis }),
        {
          attempts: 3,
          delayMs: 500,
          shouldRetry: (error) => toErrorMessage(error).length > 0,
        },
      );

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
