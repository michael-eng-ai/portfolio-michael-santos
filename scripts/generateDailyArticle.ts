import { promises as fs } from "node:fs";
import path from "node:path";

import { GoogleGenAI, Type } from "@google/genai";
import { jsonrepair } from "jsonrepair";
import OpenAI from "openai";

import { getNewsReferences, getProjects, getArticles } from "@/lib/content";
import { generateCoverImage } from "@/lib/image-gen";
import { generateLocalCoverImage } from "@/lib/local-cover";
import { isLlmUnavailableError } from "@/lib/llm-text";
import { toErrorMessage, withRetry } from "@/lib/runtime";

const DEFAULT_KIMI_BASE_URL = "https://api.moonshot.ai/v1";
const DEFAULT_KIMI_MODEL = "kimi-k2-turbo-preview";
const KIMI_REQUEST_TIMEOUT_MS = 10 * 60 * 1000;
const DEFAULT_GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai";
const DEFAULT_GEMINI_MODEL = "gemini-flash-latest";
const GEMINI_REQUEST_TIMEOUT_MS = 10 * 60 * 1000;
const KIMI_MAX_TOKENS = 16384;
const GEMINI_MAX_TOKENS = 16384;

// How many times to regenerate when the produced title duplicates or closely
// paraphrases an already-published article. Above this, fail loudly instead of
// publishing yet another near-duplicate.
const MAX_NOVELTY_ATTEMPTS = 3;
// Overlap-coefficient threshold (shared significant words / smaller title's
// word count) above which two titles are treated as the same topic.
const NOVELTY_SIMILARITY_THRESHOLD = 0.5;
// How many recent titles to surface to the model as "do not repeat" context.
const RECENT_TITLE_CONTEXT = 30;
// Prefer related news fresher than this unless the article is evergreen.
const RELATED_NEWS_MAX_AGE_DAYS = 45;
const EVERGREEN_CATEGORY_HINTS = ["evergreen", "fundamentals", "foundations", "primer"];

type ArticlePayload = {
  titleEn: string;
  titlePt: string;
  excerptEn: string;
  excerptPt: string;
  categoryEn: string;
  categoryPt: string;
  tags: string[];
  readingMinutes: number;
  relatedProjectSlugs: string[];
  relatedNewsSlugs: string[];
  bodyEn: string;
  bodyPt: string;
};

type Provider = "kimi" | "gemini" | "groq";

const DEFAULT_GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT =
  "You write precise bilingual content for a data engineering portfolio site. Avoid hype. Keep it useful for recruiters and engineering managers. Respond with valid JSON only.";

function resolveProvider(): Provider {
  const explicit = process.env.LLM_PROVIDER?.toLowerCase();
  if (
    explicit === "kimi" ||
    explicit === "gemini" ||
    explicit === "groq"
  ) {
    return explicit;
  }
  if (explicit === "anthropic") {
    throw new Error("Unsupported LLM_PROVIDER. Set LLM_PROVIDER=kimi, gemini, or groq.");
  }
  if (process.env.KIMI_API_KEY) {
    return "kimi";
  }
  if (process.env.GEMINI_API_KEY) {
    return "gemini";
  }
  if (process.env.GROQ_API_KEY) {
    return "groq";
  }
  throw new Error(
    "No LLM provider configured. Set KIMI_API_KEY, GEMINI_API_KEY, or GROQ_API_KEY.",
  );
}

function hasProviderKey(provider: Provider): boolean {
  switch (provider) {
    case "kimi":
      return Boolean(process.env.KIMI_API_KEY);
    case "gemini":
      return Boolean(process.env.GEMINI_API_KEY);
    case "groq":
      return Boolean(process.env.GROQ_API_KEY);
  }
}

function getProviderPlan(primary: Provider): Provider[] {
  const fallbackOrder: Provider[] = ["groq", "gemini", "kimi"];
  return [primary, ...fallbackOrder.filter((provider) => provider !== primary)]
    .filter((provider) => hasProviderKey(provider));
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extractJson(raw: string): string {
  // Only match an explicit ```json fence. Plain ``` would also catch code
  // blocks inside the article body (Python, SQL, YAML) and try to parse
  // those as JSON, which fails.
  const fenceMatch = raw.match(/```json\s*([\s\S]+?)```/i);
  if (fenceMatch) {
    return fenceMatch[1].trim();
  }

  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("LLM response did not contain a JSON object.");
  }

  return raw.slice(firstBrace, lastBrace + 1);
}

function getJsonCandidates(raw: string): string[] {
  const extracted = extractJson(raw);
  const candidates = [extracted];

  // Gemini occasionally returns an object with escaped line breaks/quotes
  // without wrapping it as a valid JSON string, e.g. \n{\n  \"title\": ...
  if (extracted.includes("\\n") || extracted.includes('\\"')) {
    candidates.push(
      extracted
        .replace(/\\r/g, "\r")
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t")
        .replace(/\\"/g, '"'),
    );
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed === "string" && parsed.trim().length > 0) {
      candidates.push(extractJson(parsed));
    }
  } catch {
    // Raw response is usually not a JSON string; ignore and try other forms.
  }

  return [...new Set(candidates.map((candidate) => candidate.trim()))];
}

function parseArticlePayload(rawText: string): ArticlePayload {
  const errors: string[] = [];

  for (const candidate of getJsonCandidates(rawText)) {
    try {
      return JSON.parse(candidate) as ArticlePayload;
    } catch (parseError) {
      errors.push(`JSON.parse: ${(parseError as Error).message}`);
    }

    try {
      return JSON.parse(jsonrepair(candidate)) as ArticlePayload;
    } catch (repairError) {
      errors.push(`jsonrepair: ${(repairError as Error).message}`);
    }
  }

  throw new Error(`Unable to parse article JSON payload. ${errors.join(" | ")}`);
}

// Words ignored when comparing titles for topical overlap: articles,
// prepositions, and year tokens that recur regardless of subject.
const TITLE_STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "for", "with", "without", "your", "you", "our", "of", "to", "in",
  "on", "at", "by", "from", "how", "why", "what", "when", "where", "is", "are", "be", "that", "this",
  "into", "as", "it", "its", "de", "da", "do", "para", "com", "sem", "os", "as", "um", "uma", "na",
  "no", "em", "por", "que", "2024", "2025", "2026", "2027",
]);

function significantWords(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length >= 4 && !TITLE_STOPWORDS.has(word)),
  );
}

function titleSimilarity(left: string, right: string): number {
  const a = significantWords(left);
  const b = significantWords(right);
  if (a.size === 0 || b.size === 0) {
    return 0;
  }

  let shared = 0;
  for (const word of a) {
    if (b.has(word)) {
      shared += 1;
    }
  }

  return shared / Math.min(a.size, b.size);
}

function findSimilarTitle(candidate: string, existing: string[]): string | null {
  for (const title of existing) {
    if (titleSimilarity(candidate, title) >= NOVELTY_SIMILARITY_THRESHOLD) {
      return title;
    }
  }
  return null;
}

// Significant words that recur across many recent titles — i.e., the themes the
// catalogue is already saturated with, which the model should steer away from.
function overCoveredThemes(titles: string[], minCount = 3, limit = 6): string[] {
  const counts = new Map<string, number>();
  for (const title of titles) {
    for (const word of significantWords(title)) {
      counts.set(word, (counts.get(word) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .filter(([, count]) => count >= minCount)
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([word, count]) => `${word} (${count}×)`);
}

function daysSince(isoDate: string, today = new Date()): number {
  const published = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(published.getTime())) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.floor((today.getTime() - published.getTime()) / (1000 * 60 * 60 * 24));
}

function isEvergreenCategory(categoryEn: string): boolean {
  const normalized = categoryEn.toLowerCase();
  return EVERGREEN_CATEGORY_HINTS.some((hint) => normalized.includes(hint));
}

function buildPrompt(
  projects: Awaited<ReturnType<typeof getProjects>>,
  news: Awaited<ReturnType<typeof getNewsReferences>>,
  recentArticles: Awaited<ReturnType<typeof getArticles>>,
  avoidTitles: string[],
): string {
  const publishedTitles = recentArticles
    .slice(0, RECENT_TITLE_CONTEXT)
    .map((article) => `- ${article.locales.en.title}`)
    .join("\n");
  const saturatedThemes = overCoveredThemes(
    recentArticles.map((article) => article.locales.en.title),
  );
  const freshNews = news.filter((item) => daysSince(item.publishedAt) <= RELATED_NEWS_MAX_AGE_DAYS);
  const newsForPrompt = (freshNews.length > 0 ? freshNews : news).slice(0, 24);

  return `
You are generating a bilingual article draft for a senior data engineering portfolio platform.

NOVELTY & ATTENTION (highest priority — the catalogue already has 50+ articles and readers churn on repetition):
   - Choose a primary topic CLEARLY DISTINCT from every entry in "ALREADY PUBLISHED" below. Do not duplicate, paraphrase, re-angle, or reuse the same primary keyword as any of them.
   - Do NOT default to "self-healing data pipelines", "Claude MCP", or "agentic pipelines" — those are already over-covered.${saturatedThemes.length ? ` The most saturated keywords right now are: ${saturatedThemes.join(", ")}. Do not lead with these.` : ""}
   - Vary the title structure every run; never reuse a fixed template. Do not append "in 2026"/"in 2025" as a crutch — only include a year when the claim is genuinely time-bound, and never on consecutive articles.
   - Percentage / "X% of companies" claims are banned unless the body cites a named source (report, vendor doc, or news slug) in the same paragraph. Prefer concrete incident/cost/SLO framing over unverified stats.
   - Pick a fresh entry angle for the body (incident postmortem, benchmark, migration story, architecture trade-off, cost analysis, hands-on build) that differs from recent articles.${avoidTitles.length ? `\n   - REJECTED THIS RUN as too similar — pick something clearly different from these too:\n${avoidTitles.map((title) => `     - ${title}`).join("\n")}` : ""}

OPENING HOOK (non-negotiable for retention):
   - The first 2–3 sentences of bodyEn/bodyPt must create business tension: a production incident, cost overrun, SLO breach, on-call pain, or decision risk a hiring manager recognizes.
   - Do NOT open with a definition, a history lesson, or "In this article we will…".
   - After the tension, deliver the technical response and proof. Social excerpts will reuse this opening — make it punchy without clickbait spam.

ALREADY PUBLISHED — must not be duplicated or paraphrased (most recent first):
${publishedTitles || "- (none yet)"}

SEO DISCIPLINE (non-negotiable — optimized for Google organic discovery on long-tail intents):

1. TITLE (titleEn, titlePt):
   - 50–65 characters including spaces. Must fit one SERP line.
   - Front-load the primary long-tail keyword a senior data engineer or engineering manager would actually type into Google. The keyword must NOT appear in the ALREADY PUBLISHED list above. (Illustrative formats only — do not copy: "pgvector hybrid search production", "dbt Fusion vs SQLMesh CDC".)
   - No clickbait. No "How I" / "The Ultimate Guide" unless it genuinely fits.
   - Avoid competing for generic head terms like "data engineering" alone.

2. EXCERPT (excerptEn, excerptPt):
   - 140–160 characters. This becomes the meta description on SERP.
   - Promise a specific outcome + include the primary keyword once.
   - Echo the business tension (cost / SLO / incident), not a bland summary.
   - End with a concrete benefit, not a tease.

3. BODY (bodyEn, bodyPt):
   - Minimum 1400 words, maximum 2200 words in each language.
   - First 100 characters of the body MUST contain the primary keyword naturally AND the business tension from OPENING HOOK.
   - Structure: intro paragraph (no heading) → four to six "## H2" sections → optional "### H3" subsections.
   - Use H2 wording that a human would paste into Google (question-shaped or gap-shaped), tailored to this article's specific topic rather than a recycled example.
   - Include at least one internal link: "[anchor](/articles/OTHER_SLUG)" pointing to an existing relevant article slug (pick from the news refs or recent articles section context). Use a descriptive anchor, never "click here".
   - Include at least one project link: "[anchor](/projects/PROJECT_SLUG)" from the project references above.
   - Include one technical code block (SQL, Python, or YAML) showing an implementation detail — not pseudocode.
   - Avoid AI-telltale phrases: "In today's rapidly evolving landscape", "In the world of", "It is important to note that", "Furthermore", "Moreover".

4. TAGS: 3–5 lowercase kebab-case tags that match how practitioners tag posts on dev.to or Medium (e.g., "agentic-ai", "pgvector", "dbt-fusion", not generic "technology" or "ai").

5. RELATED LINKS: relatedProjectSlugs must reference slugs from the project list above. relatedNewsSlugs must reference slugs from the news list above (prefer items marked FRESH). Never invent slugs. Prefer news published within the last ${RELATED_NEWS_MAX_AGE_DAYS} days unless categoryEn is clearly evergreen/fundamentals.

Use the following project references:
${projects
  .map(
    (project) =>
      `- ${project.slug}: ${project.locales.en.title} | ${project.locales.en.summary}`,
  )
  .join("\n")}

Use the following news references:
${newsForPrompt
  .map((item) => {
    const age = daysSince(item.publishedAt);
    const freshness =
      age <= RELATED_NEWS_MAX_AGE_DAYS ? "FRESH" : `STALE(${age}d)`;
    return `- ${item.slug}: ${item.locales.en.title} | ${freshness} | published=${item.publishedAt} | source=${item.sourceName} | why=${item.locales.en.whyItMatters}`;
  })
  .join("\n")}

Return valid JSON with this shape:
{
  "titleEn": "",
  "titlePt": "",
  "excerptEn": "",
  "excerptPt": "",
  "categoryEn": "",
  "categoryPt": "",
  "tags": ["", ""],
  "readingMinutes": 6,
  "relatedProjectSlugs": ["project-slug"],
  "relatedNewsSlugs": ["news-slug"],
  "bodyEn": "Markdown body in English",
  "bodyPt": "Markdown body in Portuguese"
}

The article should connect a real market theme to one or more GitHub projects. Return only the JSON object, no commentary.
`;
}

async function generateWithKimi(prompt: string): Promise<string> {
  const client = new OpenAI({
    apiKey: process.env.KIMI_API_KEY,
    baseURL: process.env.KIMI_BASE_URL || DEFAULT_KIMI_BASE_URL,
    timeout: KIMI_REQUEST_TIMEOUT_MS,
  });

  const completion = await client.chat.completions.create({
    model: process.env.KIMI_MODEL || DEFAULT_KIMI_MODEL,
    max_tokens: KIMI_MAX_TOKENS,
    temperature: 1,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Kimi response did not contain text content.");
  }
  return content;
}

async function generateWithGemini(prompt: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const stringField = { type: Type.STRING };
  const stringArrayField = { type: Type.ARRAY, items: { type: Type.STRING } };

  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 1,
      maxOutputTokens: GEMINI_MAX_TOKENS,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          titleEn: stringField,
          titlePt: stringField,
          excerptEn: stringField,
          excerptPt: stringField,
          categoryEn: stringField,
          categoryPt: stringField,
          tags: stringArrayField,
          readingMinutes: { type: Type.INTEGER },
          relatedProjectSlugs: stringArrayField,
          relatedNewsSlugs: stringArrayField,
          bodyEn: stringField,
          bodyPt: stringField,
        },
        required: [
          "titleEn",
          "titlePt",
          "excerptEn",
          "excerptPt",
          "categoryEn",
          "categoryPt",
          "tags",
          "readingMinutes",
          "relatedProjectSlugs",
          "relatedNewsSlugs",
          "bodyEn",
          "bodyPt",
        ],
        propertyOrdering: [
          "titleEn",
          "titlePt",
          "excerptEn",
          "excerptPt",
          "categoryEn",
          "categoryPt",
          "tags",
          "readingMinutes",
          "relatedProjectSlugs",
          "relatedNewsSlugs",
          "bodyEn",
          "bodyPt",
        ],
      },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini response did not contain text content.");
  }
  return text;
}

async function generateWithGroq(prompt: string): Promise<string> {
  const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: process.env.GROQ_BASE_URL || DEFAULT_GROQ_BASE_URL,
  });

  const completion = await client.chat.completions.create({
    model: process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL,
    max_tokens: KIMI_MAX_TOKENS,
    temperature: 1,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Groq response did not contain text content.");
  }
  return content;
}

async function generatePayload(prompt: string, providerPlan: Provider[]): Promise<ArticlePayload> {
  const generate = (targetProvider: Provider): Promise<string> => {
    switch (targetProvider) {
      case "kimi":
        return generateWithKimi(prompt);
      case "gemini":
        return generateWithGemini(prompt);
      case "groq":
        return generateWithGroq(prompt);
    }
  };

  const providerErrors: string[] = [];

  for (const targetProvider of providerPlan) {
    console.log(`Generating article via provider=${targetProvider}`);

    try {
      return await withRetry(
        async () => parseArticlePayload(await generate(targetProvider)),
        {
          attempts: 3,
          delayMs: 8_000,
          shouldRetry: (error) => {
            const msg = toErrorMessage(error).toLowerCase();
            return (
              msg.includes("503") ||
              msg.includes("unavailable") ||
              msg.includes("overloaded") ||
              msg.includes("rate") ||
              msg.includes("timeout") ||
              msg.includes("high demand") ||
              msg.includes("529") ||
              msg.includes("unable to parse article json payload")
            );
          },
          onRetry: (error, attempt, nextDelayMs) => {
            console.warn(
              `Article generation attempt ${attempt} failed for provider=${targetProvider} (${toErrorMessage(error)}); retrying in ${nextDelayMs}ms`,
            );
          },
        },
      );
    } catch (error) {
      providerErrors.push(`${targetProvider}: ${toErrorMessage(error)}`);
      console.warn(`Provider ${targetProvider} failed; trying next configured provider if available.`);
    }
  }

  throw new Error(`Article generation failed for all configured providers. ${providerErrors.join(" | ")}`);
}

async function main() {
  const provider = resolveProvider();
  const [projects, news, recentArticles] = await Promise.all([
    getProjects(),
    getNewsReferences(),
    getArticles(),
  ]);

  const providerPlan = getProviderPlan(provider);
  if (providerPlan.length === 0) {
    throw new Error(`Provider ${provider} was selected but its API key is not configured.`);
  }

  const existingTitles = recentArticles.map((article) => article.locales.en.title);
  const existingSlugs = new Set(recentArticles.map((article) => article.slug));

  // Generate, then reject-and-retry if the model produced a title that
  // duplicates or closely paraphrases something already in the catalogue.
  // Each rejected title is fed back into the prompt to steer the next attempt.
  const avoidTitles: string[] = [];
  let payload: ArticlePayload | null = null;
  let slug = "";

  for (let attempt = 1; attempt <= MAX_NOVELTY_ATTEMPTS; attempt += 1) {
    const prompt = buildPrompt(projects, news, recentArticles, avoidTitles);
    const candidate = await generatePayload(prompt, providerPlan);
    const candidateSlug = slugify(candidate.titleEn);
    const similarTo = findSimilarTitle(candidate.titleEn, existingTitles);

    if (!existingSlugs.has(candidateSlug) && !similarTo) {
      payload = candidate;
      slug = candidateSlug;
      break;
    }

    const reason = existingSlugs.has(candidateSlug)
      ? `slug "${candidateSlug}" already exists`
      : `title too similar to existing "${similarTo}"`;
    console.warn(
      `Novelty check failed (attempt ${attempt}/${MAX_NOVELTY_ATTEMPTS}): ${reason}. Regenerating with a stronger anti-repetition hint.`,
    );
    avoidTitles.push(candidate.titleEn);
  }

  if (!payload) {
    throw new Error(
      `Could not generate a sufficiently novel article after ${MAX_NOVELTY_ATTEMPTS} attempts. Rejected: ${avoidTitles.join(" | ")}`,
    );
  }

  // Soft freshness gate for related news (warn loudly; do not hard-fail evergreen).
  const newsBySlug = new Map(news.map((item) => [item.slug, item]));
  const staleRelated = payload.relatedNewsSlugs.filter((newsSlug) => {
    const item = newsBySlug.get(newsSlug);
    if (!item) return false;
    return daysSince(item.publishedAt) > RELATED_NEWS_MAX_AGE_DAYS;
  });
  if (staleRelated.length > 0 && !isEvergreenCategory(payload.categoryEn)) {
    console.warn(
      `::warning title=Stale related news::relatedNewsSlugs older than ${RELATED_NEWS_MAX_AGE_DAYS}d: ${staleRelated.join(", ")}`,
    );
  }

  // Generate cover image (Gemini first, then local branded PNG fallback).
  let imageUrl: string | undefined;
  let coverFailed = false;
  if (process.env.SKIP_COVER_IMAGE === "true") {
    console.log("SKIP_COVER_IMAGE=true; not generating a cover image.");
  } else {
    const imagePrompt = `${payload.titleEn}. ${payload.excerptEn}. Tags: ${payload.tags.join(", ")}.`;
    try {
      if (process.env.GEMINI_API_KEY) {
        try {
          const cover = await generateCoverImage({ slug, prompt: imagePrompt });
          imageUrl = cover.publicUrl;
          console.log(
            `Cover image generated via ${cover.model} (${(cover.bytes / 1024).toFixed(0)} KB) -> ${cover.publicUrl}`,
          );
        } catch (error) {
          const message = (error as Error).message;
          console.warn(
            `::warning title=Cover image Gemini failed::${slug} — ${message.slice(0, 160)}; using local PNG fallback`,
          );
          const local = await generateLocalCoverImage({
            slug,
            title: payload.titleEn,
            eyebrow: payload.categoryEn,
          });
          imageUrl = local.publicUrl;
          console.log(
            `Cover image generated via ${local.model} (${(local.bytes / 1024).toFixed(0)} KB) -> ${local.publicUrl}`,
          );
        }
      } else {
        console.warn("::warning title=Cover image::GEMINI_API_KEY not set; using local branded PNG cover.");
        const local = await generateLocalCoverImage({
          slug,
          title: payload.titleEn,
          eyebrow: payload.categoryEn,
        });
        imageUrl = local.publicUrl;
        console.log(
          `Cover image generated via ${local.model} (${(local.bytes / 1024).toFixed(0)} KB) -> ${local.publicUrl}`,
        );
      }
    } catch (error) {
      coverFailed = true;
      const message = (error as Error).message;
      console.warn(
        `::warning title=Cover image failed::${slug} — ${message.slice(0, 180)}`,
      );
    }
  }

  if (!imageUrl && process.env.GEMINI_API_KEY && process.env.SKIP_COVER_IMAGE !== "true") {
    // Surface for PR body / auto-merge soft gate.
    await fs.writeFile(
      path.join(process.cwd(), ".article-cover-status"),
      `missing\n${slug}\n${coverFailed ? "generation_failed" : "unknown"}\n`,
      "utf8",
    );
  } else if (imageUrl) {
    await fs.writeFile(
      path.join(process.cwd(), ".article-cover-status"),
      `ok\n${slug}\n${imageUrl}\n`,
      "utf8",
    );
  }

  const article = {
    slug,
    publishedAt: new Date().toISOString().slice(0, 10),
    featured: false,
    ...(imageUrl ? { imageUrl } : {}),
    category: {
      en: payload.categoryEn,
      pt: payload.categoryPt,
    },
    tags: payload.tags.slice(0, 5),
    readingMinutes: payload.readingMinutes,
    relatedProjectSlugs: payload.relatedProjectSlugs,
    relatedNewsSlugs: payload.relatedNewsSlugs,
    locales: {
      en: {
        title: payload.titleEn,
        excerpt: payload.excerptEn,
        body: payload.bodyEn,
      },
      pt: {
        title: payload.titlePt,
        excerpt: payload.excerptPt,
        body: payload.bodyPt,
      },
    },
  };

  const target = path.join(process.cwd(), "content", "articles", `${slug}.json`);
  await fs.writeFile(target, `${JSON.stringify(article, null, 2)}\n`, "utf8");
  console.log(`Created ${target}`);
}

main().catch((error) => {
  if (isLlmUnavailableError(error)) {
    // Every provider is rate-limited / out of quota / suspended. Skip this run
    // instead of failing the workflow (and opening a failure issue); the next
    // scheduled run retries once capacity returns.
    console.warn(`[article] skipped: all LLM providers are unavailable — ${toErrorMessage(error)}`);
    process.exit(0);
  }
  console.error(error);
  process.exit(1);
});
