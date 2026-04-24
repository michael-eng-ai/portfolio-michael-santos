import { promises as fs } from "node:fs";
import path from "node:path";

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

import { getNewsReferences, getProjects } from "@/lib/content";

const DEFAULT_KIMI_BASE_URL = "https://api.moonshot.ai/v1";
const DEFAULT_KIMI_MODEL = "kimi-k2.5";
const DEFAULT_CLAUDE_MODEL = "claude-sonnet-4-5";
const KIMI_MAX_TOKENS = 16384;
const ANTHROPIC_MAX_TOKENS = 4096;
const ANTHROPIC_TEMPERATURE = 0.7;

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

type Provider = "kimi" | "anthropic";

const SYSTEM_PROMPT =
  "You write precise bilingual content for a data engineering portfolio site. Avoid hype. Keep it useful for recruiters and engineering managers. Respond with valid JSON only.";

function resolveProvider(): Provider {
  const explicit = process.env.LLM_PROVIDER?.toLowerCase();
  if (explicit === "kimi" || explicit === "anthropic") {
    return explicit;
  }
  if (process.env.KIMI_API_KEY) {
    return "kimi";
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return "anthropic";
  }
  throw new Error(
    "No LLM provider configured. Set KIMI_API_KEY or ANTHROPIC_API_KEY.",
  );
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

function buildPrompt(
  projects: Awaited<ReturnType<typeof getProjects>>,
  news: Awaited<ReturnType<typeof getNewsReferences>>,
): string {
  return `
You are generating a bilingual article draft for a senior data engineering portfolio platform.

SEO DISCIPLINE (non-negotiable — optimized for Google organic discovery on long-tail intents):

1. TITLE (titleEn, titlePt):
   - 50–65 characters including spaces. Must fit one SERP line.
   - Front-load the primary long-tail keyword (what a senior data engineer or engineering manager would actually type into Google — e.g., "self-healing data pipeline with Claude MCP", "pgvector hybrid search production", "dbt Fusion vs SQLMesh").
   - No clickbait. No "How I" / "The Ultimate Guide" unless it genuinely fits.
   - Avoid competing for generic head terms like "data engineering" alone.

2. EXCERPT (excerptEn, excerptPt):
   - 140–160 characters. This becomes the meta description on SERP.
   - Promise a specific outcome + include the primary keyword once.
   - End with a concrete benefit, not a tease.

3. BODY (bodyEn, bodyPt):
   - Minimum 1400 words, maximum 2200 words in each language.
   - First 100 characters of the body MUST contain the primary keyword naturally.
   - Structure: intro paragraph (no heading) → four to six "## H2" sections → optional "### H3" subsections.
   - Use H2 wording that a human would paste into Google (question-shaped or gap-shaped). Examples: "## When self-healing actually saves on-call hours", "## Why dbt Fusion changes the CDC migration math".
   - Include at least one internal link: "[anchor](/articles/OTHER_SLUG)" pointing to an existing relevant article slug (pick from the news refs or recent articles section context). Use a descriptive anchor, never "click here".
   - Include at least one project link: "[anchor](/projects/PROJECT_SLUG)" from the project references above.
   - Include one technical code block (SQL, Python, or YAML) showing an implementation detail — not pseudocode.
   - Avoid AI-telltale phrases: "In today's rapidly evolving landscape", "In the world of", "It is important to note that", "Furthermore", "Moreover".

4. TAGS: 3–5 lowercase kebab-case tags that match how practitioners tag posts on dev.to or Medium (e.g., "agentic-ai", "pgvector", "dbt-fusion", not generic "technology" or "ai").

5. RELATED LINKS: relatedProjectSlugs must reference slugs from the project list above. relatedNewsSlugs must reference slugs from the news list above. Never invent slugs.

Use the following project references:
${projects
  .map(
    (project) =>
      `- ${project.slug}: ${project.locales.en.title} | ${project.locales.en.summary}`,
  )
  .join("\n")}

Use the following news references:
${news
  .map(
    (item) =>
      `- ${item.slug}: ${item.locales.en.title} | source=${item.sourceName} | why=${item.locales.en.whyItMatters}`,
  )
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

async function generateWithAnthropic(prompt: string): Promise<string> {
  const client = new Anthropic();

  const response = await client.messages.create({
    model: process.env.CLAUDE_CONTENT_MODEL ?? DEFAULT_CLAUDE_MODEL,
    max_tokens: ANTHROPIC_MAX_TOKENS,
    temperature: ANTHROPIC_TEMPERATURE,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Anthropic response did not contain text content.");
  }
  return textBlock.text;
}

async function main() {
  const provider = resolveProvider();
  const [projects, news] = await Promise.all([getProjects(), getNewsReferences()]);
  const prompt = buildPrompt(projects, news);

  console.log(`Generating article via provider=${provider}`);
  const rawText =
    provider === "kimi"
      ? await generateWithKimi(prompt)
      : await generateWithAnthropic(prompt);

  const payload = JSON.parse(extractJson(rawText)) as ArticlePayload;

  const slug = slugify(payload.titleEn);
  const article = {
    slug,
    publishedAt: new Date().toISOString().slice(0, 10),
    featured: false,
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
  console.error(error);
  process.exit(1);
});
