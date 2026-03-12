import { promises as fs } from "node:fs";
import path from "node:path";

import Parser from "rss-parser";
import { z } from "zod";

import { clampText, editorialLimits } from "@/lib/editorial";
import { newsSchema } from "@/lib/content";

const feedSourceSchema = z.object({
  slug: z.string().min(1),
  sourceName: z.string().min(1),
  homepageUrl: z.string().url(),
  feedUrl: z.string().url(),
  defaultImageUrl: z.string().url().optional(),
  category: z.object({ en: z.string().min(1), pt: z.string().min(1) }).optional(),
  tags: z.array(z.string().min(1)).default([]),
  relatedProjectSlugs: z.array(z.string().min(1)).default([]),
  topic: z.object({
    en: z.string().min(1),
    pt: z.string().min(1),
  }),
  whyItMatters: z.object({
    en: z.string().min(1),
    pt: z.string().min(1),
  }),
  maxItems: z.number().int().positive().default(4),
});

const feedCatalogSchema = z.array(feedSourceSchema);

const generatedNewsFileSchema = z.object({
  syncedAt: z.string().min(1),
  items: z.array(newsSchema),
});

type FeedSource = z.infer<typeof feedSourceSchema>;

type FeedItem = {
  title?: string;
  link?: string;
  isoDate?: string;
  pubDate?: string;
  content?: string;
  contentSnippet?: string;
  summary?: string;
};

const parser = new Parser<Record<string, never>, FeedItem>({
  customFields: {
    item: ["summary"],
  },
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function stripHtml(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3).trimEnd()}...`;
}

function normalizePublishedAt(value?: string) {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }

  return parsed.toISOString().slice(0, 10);
}

function getExcerpt(item: FeedItem) {
  const raw = item.contentSnippet ?? item.summary ?? item.content ?? "";
  return truncate(stripHtml(raw), 220);
}

function resolveSourceUrl(source: FeedSource, link?: string) {
  if (!link) {
    return null;
  }

  try {
    return new URL(link, source.homepageUrl).toString();
  } catch {
    return null;
  }
}

function detectTags(source: FeedSource, title: string, excerpt: string) {
  const detected = new Set(source.tags);
  const haystack = `${title} ${excerpt}`.toLowerCase();
  const keywordMap: Array<[string, string[]]> = [
    ["ai", [" ai ", "llm", "genai", "agent", "copilot"]],
    ["lakehouse", ["lakehouse", "delta lake"]],
    ["dbt", [" dbt", "analytics engineering"]],
    ["kafka", ["kafka", "streaming", "debezium"]],
    ["governance", ["governance", "governed", "compliance"]],
    ["snowflake", ["snowflake"]],
    ["bigquery", ["bigquery"]],
    ["databricks", ["databricks"]],
  ];

  for (const [tag, keywords] of keywordMap) {
    if (keywords.some((keyword) => haystack.includes(keyword.trim()))) {
      detected.add(tag);
    }
  }

  return Array.from(detected).slice(0, 6);
}

function buildEnglishSummary(source: FeedSource, excerpt: string) {
  if (excerpt.length > 0) {
    return clampText(excerpt, editorialLimits.newsSummaryMax);
  }

  return clampText(
    `A new ${source.sourceName} update on ${source.topic.en}. Read the original source for the full details.`,
    editorialLimits.newsSummaryMax,
  );
}

const ptTitleVerbs = [
  "avanca em",
  "traz nova perspectiva sobre",
  "reforça evolucao em",
  "amplia visao sobre",
  "publica atualizacao sobre",
  "destaca mudanca em",
  "aponta tendencia em",
  "apresenta novidade em",
];

function buildPortugueseTitle(source: FeedSource, itemIndex: number) {
  const verb = ptTitleVerbs[itemIndex % ptTitleVerbs.length];
  return truncate(`${source.sourceName} ${verb} ${source.topic.pt}`, 100);
}

const ptSummaryFrames = [
  (s: FeedSource) =>
    `Esta publicacao da ${s.sourceName} aborda um avanco relevante em ${s.topic.pt}, com implicacoes para equipes de dados e liderancas que avaliam suas estrategias de plataforma.`,
  (s: FeedSource) =>
    `A ${s.sourceName} compartilhou uma perspectiva que conecta ${s.topic.pt} a decisoes de negocio, reuso de dados e velocidade de entrega analitica.`,
  (s: FeedSource) =>
    `Atualizacao da ${s.sourceName} sobre ${s.topic.pt} que impacta como organizacoes planejam governanca, escala e confianca em seus pipelines de dados.`,
  (s: FeedSource) =>
    `Nova publicacao da ${s.sourceName} explora como ${s.topic.pt} esta redefinindo prioridades de investimento, operacao e entrega para times de dados.`,
];

function buildPortugueseSummary(source: FeedSource, itemIndex: number) {
  const frame = ptSummaryFrames[itemIndex % ptSummaryFrames.length];
  return clampText(frame(source), editorialLimits.newsSummaryMax);
}

async function fetchFeed(source: FeedSource) {
  const response = await fetch(source.feedUrl, {
    headers: {
      Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
      "User-Agent": "portfolio-michael-santos/1.0 (+https://michael.business)",
    },
  });

  if (!response.ok) {
    throw new Error(`Feed request failed with status ${response.status}`);
  }

  const xml = await response.text();
  return parser.parseString(xml);
}

async function main() {
  const catalogPath = path.join(process.cwd(), "content", "sources", "news-feeds.json");
  const rawCatalog = await fs.readFile(catalogPath, "utf8");
  const sources = feedCatalogSchema.parse(JSON.parse(rawCatalog));
  const outputPath = path.join(process.cwd(), "content", "generated", "news.json");

  const items = [];
  const seenUrls = new Set<string>();

  for (const source of sources) {
    try {
      const feed = await fetchFeed(source);
      let syncedCount = 0;

      for (const item of feed.items ?? []) {
        if (syncedCount >= source.maxItems) {
          break;
        }

        const title = item.title?.trim();
        const sourceUrl = resolveSourceUrl(source, item.link);

        if (!title || !sourceUrl || seenUrls.has(sourceUrl)) {
          continue;
        }

        const excerpt = getExcerpt(item);
        const normalized = newsSchema.parse({
          slug: `${source.slug}-${slugify(title)}`,
          publishedAt: normalizePublishedAt(item.isoDate ?? item.pubDate),
          sourceName: source.sourceName,
          sourceUrl,
          imageUrl: source.defaultImageUrl,
          category: source.category,
          tags: detectTags(source, title, excerpt),
          relatedProjectSlugs: source.relatedProjectSlugs,
          locales: {
            en: {
              title,
              summary: buildEnglishSummary(source, excerpt),
              whyItMatters: source.whyItMatters.en,
            },
            pt: {
              title: buildPortugueseTitle(source, syncedCount),
              summary: buildPortugueseSummary(source, syncedCount),
              whyItMatters: source.whyItMatters.pt,
            },
          },
        });

        items.push(normalized);
        seenUrls.add(sourceUrl);
        syncedCount += 1;
      }

      console.log(`Synced ${syncedCount} items from ${source.sourceName}`);
    } catch (error) {
      console.warn(`Skipping ${source.sourceName}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  const payload = generatedNewsFileSchema.parse({
    syncedAt: new Date().toISOString(),
    items: items.sort((left, right) => right.publishedAt.localeCompare(left.publishedAt)).slice(0, 24),
  });

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Updated ${outputPath} with ${payload.items.length} news items.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
