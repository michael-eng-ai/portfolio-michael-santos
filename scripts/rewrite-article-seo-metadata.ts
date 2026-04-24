import { promises as fs } from "node:fs";
import path from "node:path";

import OpenAI from "openai";

const DEFAULT_BASE_URL = "https://api.moonshot.ai/v1";
const DEFAULT_MODEL = "kimi-k2.5";

type ArticleLocale = {
  title: string;
  excerpt: string;
  body: string;
};

type Article = {
  slug: string;
  publishedAt: string;
  featured?: boolean;
  imageUrl?: string;
  category: { en: string; pt: string };
  tags: string[];
  readingMinutes: number;
  relatedProjectSlugs?: string[];
  relatedNewsSlugs?: string[];
  locales: { en: ArticleLocale; pt: ArticleLocale };
  [key: string]: unknown;
};

type RewritePayload = {
  titleEn: string;
  titlePt: string;
  excerptEn: string;
  excerptPt: string;
};

const SYSTEM_PROMPT =
  "You rewrite article metadata for SEO. You only return valid JSON. You never add commentary. You never use AI-tell phrases like 'in today's landscape' or 'it is important to note'.";

function buildPrompt(article: Article): string {
  const enBody = article.locales.en.body.slice(0, 700);
  const ptBody = article.locales.pt.body.slice(0, 700);

  return `Rewrite the SEO title and meta description (excerpt) for this existing article. Do NOT change the body or subject matter — only make the title and excerpt search-optimized.

CONSTRAINTS:
- titleEn and titlePt: 50-65 characters each (must fit one SERP line). Front-load the primary long-tail keyword an experienced data engineer or engineering manager would actually type into Google. No clickbait. No "How I" or "The Ultimate Guide" unless it genuinely fits.
- excerptEn and excerptPt: 140-160 characters each. This becomes the meta description. Promise a specific outcome, include the primary keyword once, end with a concrete benefit.
- Keep the pt version idiomatic Brazilian Portuguese, not a literal translation of the English.
- Preserve the factual scope and angle of the original — do not invent claims not supported by the body.

ARTICLE CONTEXT:
- Slug: ${article.slug}
- Current English title: ${article.locales.en.title}
- Current Portuguese title: ${article.locales.pt.title}
- Current English excerpt: ${article.locales.en.excerpt}
- Current Portuguese excerpt: ${article.locales.pt.excerpt}
- Tags: ${article.tags.join(", ")}
- English body (first 1200 chars): ${enBody}
- Portuguese body (first 1200 chars): ${ptBody}

Return valid JSON with exactly these four keys:
{
  "titleEn": "",
  "titlePt": "",
  "excerptEn": "",
  "excerptPt": ""
}`;
}

function extractJson(raw: string): string {
  // Only match explicit ```json fence; plain ``` would catch code blocks
  // inside the article body (Python/SQL/YAML) and corrupt parsing.
  const fence = raw.match(/```json\s*([\s\S]+?)```/i);
  if (fence) return fence[1].trim();
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) {
    throw new Error("No JSON object in response");
  }
  return raw.slice(first, last + 1);
}

function isWithinRange(value: string, min: number, max: number): boolean {
  const len = value.length;
  return len >= min && len <= max;
}

async function rewriteArticle(
  client: OpenAI,
  model: string,
  article: Article,
): Promise<RewritePayload> {
  const completion = await client.chat.completions.create({
    model,
    max_tokens: 16384,
    temperature: 1,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildPrompt(article) },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty Kimi response");
  }
  const parsed = JSON.parse(extractJson(content)) as RewritePayload;

  const fields: (keyof RewritePayload)[] = [
    "titleEn",
    "titlePt",
    "excerptEn",
    "excerptPt",
  ];
  for (const field of fields) {
    if (typeof parsed[field] !== "string" || parsed[field].length === 0) {
      throw new Error(`Missing or empty field in Kimi response: ${field}`);
    }
  }

  return parsed;
}

async function main() {
  const apiKey = process.env.KIMI_API_KEY;
  if (!apiKey) {
    throw new Error("KIMI_API_KEY is required");
  }

  const dir = path.join(process.cwd(), "content", "articles");
  const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".json"));
  files.sort();

  const client = new OpenAI({
    apiKey,
    baseURL: process.env.KIMI_BASE_URL || DEFAULT_BASE_URL,
  });
  const model = process.env.KIMI_MODEL || DEFAULT_MODEL;

  const skipFromEnv = process.env.SKIP_SLUGS?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
  const onlyFromEnv = process.env.ONLY_SLUGS?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];

  const summary: {
    rewritten: string[];
    skipped: { slug: string; reason: string }[];
    failed: { slug: string; reason: string }[];
  } = { rewritten: [], skipped: [], failed: [] };

  for (const file of files) {
    const slug = file.replace(/\.json$/, "");
    if (skipFromEnv.includes(slug)) {
      summary.skipped.push({ slug, reason: "skip-list" });
      continue;
    }
    if (onlyFromEnv.length > 0 && !onlyFromEnv.includes(slug)) {
      summary.skipped.push({ slug, reason: "not-in-only-list" });
      continue;
    }

    const fullPath = path.join(dir, file);
    const raw = await fs.readFile(fullPath, "utf8");
    const article = JSON.parse(raw) as Article;

    try {
      console.log(`Rewriting ${slug} ...`);
      const rewrite = await rewriteArticle(client, model, article);

      const warnings: string[] = [];
      if (!isWithinRange(rewrite.titleEn, 40, 70)) warnings.push(`titleEn=${rewrite.titleEn.length} chars`);
      if (!isWithinRange(rewrite.titlePt, 40, 70)) warnings.push(`titlePt=${rewrite.titlePt.length} chars`);
      if (!isWithinRange(rewrite.excerptEn, 120, 170)) warnings.push(`excerptEn=${rewrite.excerptEn.length} chars`);
      if (!isWithinRange(rewrite.excerptPt, 120, 170)) warnings.push(`excerptPt=${rewrite.excerptPt.length} chars`);
      if (warnings.length > 0) {
        console.warn(`  warn ${slug}: ${warnings.join(", ")}`);
      }

      article.locales.en.title = rewrite.titleEn;
      article.locales.pt.title = rewrite.titlePt;
      article.locales.en.excerpt = rewrite.excerptEn;
      article.locales.pt.excerpt = rewrite.excerptPt;

      await fs.writeFile(fullPath, `${JSON.stringify(article, null, 2)}\n`, "utf8");
      summary.rewritten.push(slug);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`  fail ${slug}: ${message}`);
      summary.failed.push({ slug, reason: message });
    }
  }

  console.log("\n=== Summary ===");
  console.log(`Rewritten: ${summary.rewritten.length}`);
  console.log(`Skipped:   ${summary.skipped.length}`);
  console.log(`Failed:    ${summary.failed.length}`);
  if (summary.failed.length > 0) {
    console.log("Failures:");
    for (const item of summary.failed) {
      console.log(`  - ${item.slug}: ${item.reason}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
