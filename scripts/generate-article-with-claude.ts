import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { execFile } from "node:child_process";
import { z } from "zod";

import { getArticles, getNewsReferences, getProjects } from "@/lib/content";

const execFileAsync = promisify(execFile);

const claudeArticleSchema = z.object({
  titleEn: z.string().min(1),
  titlePt: z.string().min(1),
  excerptEn: z.string().min(1),
  excerptPt: z.string().min(1),
  categoryEn: z.string().min(1),
  categoryPt: z.string().min(1),
  tags: z.array(z.string().min(1)).min(3).max(5),
  readingMinutes: z.number().int().positive().max(20),
  relatedProjectSlugs: z.array(z.string().min(1)).min(1),
  relatedNewsSlugs: z.array(z.string().min(1)).min(1),
  channelStrategy: z.object({
    site: z.object({
      primaryAngle: z.string().min(1),
      audience: z.string().min(1),
      businessMessage: z.string().min(1),
    }),
    github: z.object({
      primaryAngle: z.string().min(1),
      audience: z.string().min(1),
      operationalMessage: z.string().min(1),
    }),
    linkedin: z.object({
      primaryAngle: z.string().min(1),
      audience: z.string().min(1),
      bridgeMessage: z.string().min(1),
    }),
    x: z.object({
      primaryAngle: z.string().min(1),
      audience: z.string().min(1),
      bridgeMessage: z.string().min(1),
    }),
  }),
  bodyEn: z.string().min(1),
  bodyPt: z.string().min(1),
});

const claudeArticleJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    titleEn: { type: "string" },
    titlePt: { type: "string" },
    excerptEn: { type: "string" },
    excerptPt: { type: "string" },
    categoryEn: { type: "string" },
    categoryPt: { type: "string" },
    tags: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: { type: "string" },
    },
    readingMinutes: { type: "integer", minimum: 1, maximum: 20 },
    relatedProjectSlugs: {
      type: "array",
      minItems: 1,
      items: { type: "string" },
    },
    relatedNewsSlugs: {
      type: "array",
      minItems: 1,
      items: { type: "string" },
    },
    channelStrategy: {
      type: "object",
      additionalProperties: false,
      properties: {
        site: {
          type: "object",
          additionalProperties: false,
          properties: {
            primaryAngle: { type: "string" },
            audience: { type: "string" },
            businessMessage: { type: "string" },
          },
          required: ["primaryAngle", "audience", "businessMessage"],
        },
        github: {
          type: "object",
          additionalProperties: false,
          properties: {
            primaryAngle: { type: "string" },
            audience: { type: "string" },
            operationalMessage: { type: "string" },
          },
          required: ["primaryAngle", "audience", "operationalMessage"],
        },
        linkedin: {
          type: "object",
          additionalProperties: false,
          properties: {
            primaryAngle: { type: "string" },
            audience: { type: "string" },
            bridgeMessage: { type: "string" },
          },
          required: ["primaryAngle", "audience", "bridgeMessage"],
        },
        x: {
          type: "object",
          additionalProperties: false,
          properties: {
            primaryAngle: { type: "string" },
            audience: { type: "string" },
            bridgeMessage: { type: "string" },
          },
          required: ["primaryAngle", "audience", "bridgeMessage"],
        },
      },
      required: ["site", "github", "linkedin", "x"],
    },
    bodyEn: { type: "string" },
    bodyPt: { type: "string" },
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
    "channelStrategy",
    "bodyEn",
    "bodyPt",
  ],
} as const;

type ClaudeArticle = z.infer<typeof claudeArticleSchema>;

function readArg(flag: string) {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return null;
  }

  return process.argv[index + 1] ?? null;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function renderTemplate(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce(
    (content, [key, value]) => content.replaceAll(`{{${key}}}`, value),
    template,
  );
}

async function resolveUniqueTarget(baseSlug: string) {
  const directory = path.join(process.cwd(), "content", "articles");
  let slug = baseSlug;
  let attempt = 1;

  while (true) {
    const target = path.join(directory, `${slug}.json`);

    try {
      await fs.access(target);
      attempt += 1;
      slug = `${baseSlug}-${attempt}`;
    } catch {
      return { slug, target };
    }
  }
}

async function runClaude(prompt: string) {
  const model = process.env.CLAUDE_CONTENT_MODEL ?? "sonnet";
  const maxBudgetUsd = process.env.CLAUDE_CONTENT_MAX_BUDGET_USD ?? "1";
  const schema = JSON.stringify(claudeArticleJsonSchema);

  const { stdout } = await execFileAsync(
    "claude",
    [
      "--print",
      "--output-format",
      "text",
      "--json-schema",
      schema,
      "--allowedTools",
      "",
      "--permission-mode",
      "dontAsk",
      "--model",
      model,
      "--max-budget-usd",
      maxBudgetUsd,
      prompt,
    ],
    {
      cwd: process.cwd(),
      maxBuffer: 1024 * 1024 * 8,
    },
  );

  return claudeArticleSchema.parse(JSON.parse(stdout));
}

async function main() {
  const topicHint = readArg("--topic") ?? process.env.CLAUDE_CONTENT_TOPIC_HINT ?? "No topic hint provided.";
  const today = new Date().toISOString().slice(0, 10);

  const [articles, projects, news, template] = await Promise.all([
    getArticles(),
    getProjects(),
    getNewsReferences(),
    fs.readFile(path.join(process.cwd(), "prompts", "claude-article-generation.md"), "utf8"),
  ]);

  const prompt = renderTemplate(template, {
    TODAY: today,
    TOPIC_HINT: topicHint,
    RECENT_TITLES: articles
      .slice(0, 8)
      .map((article) => `- ${article.locales.en.title}`)
      .join("\n"),
    PROJECT_REFERENCES: projects
      .map(
        (project) =>
          `- slug=${project.slug} | title=${project.locales.en.title} | summary=${project.locales.en.summary} | github=${project.github.url}`,
      )
      .join("\n"),
    NEWS_REFERENCES: news
      .slice(0, 12)
      .map(
        (item) =>
          `- slug=${item.slug} | title=${item.locales.en.title} | source=${item.sourceName} | publishedAt=${item.publishedAt} | why=${item.locales.en.whyItMatters}`,
      )
      .join("\n"),
  });

  const payload: ClaudeArticle = await runClaude(prompt);
  const baseSlug = slugify(payload.titleEn);
  const { slug, target } = await resolveUniqueTarget(baseSlug);

  const article = {
    slug,
    publishedAt: today,
    featured: false,
    category: {
      en: payload.categoryEn,
      pt: payload.categoryPt,
    },
    tags: payload.tags,
    readingMinutes: payload.readingMinutes,
    channelStrategy: payload.channelStrategy,
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

  await fs.writeFile(target, `${JSON.stringify(article, null, 2)}\n`, "utf8");
  console.log(`Created ${target}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
