import { promises as fs } from "node:fs";
import path from "node:path";

import Parser from "rss-parser";
import { z } from "zod";

import {
  getExistingNewsRowsBySourceUrls,
  getRequiredWriteDatabaseEnvKeys,
  getSecondaryDatabaseProvider,
  listActiveNewsRows,
  upsertNewsRows,
  type NewsRowRecord,
} from "@/lib/database";
import { clampText, editorialLimits } from "@/lib/editorial";
import { newsSchema, type NewsReference } from "@/lib/content";
import { buildStableNewsSlug, detectTags, normalizePublishedAt, writeNewsSnapshot } from "@/lib/news-utils";
import { chunkArray, fetchWithTimeout, toErrorMessage, withRetry } from "@/lib/runtime";

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
  return withRetry(
    async () => {
      const response = await fetchWithTimeout(source.feedUrl, {
        timeoutMs: 12_000,
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
    },
    {
      attempts: 3,
      delayMs: 1_000,
      shouldRetry: (error) => {
        const message = toErrorMessage(error);
        return message.includes("status 429") || message.includes("status 5") || message.includes("aborted");
      },
      onRetry: (error, attempt, nextDelayMs) => {
        console.warn(
          `Retrying feed ${source.sourceName} after attempt ${attempt}: ${toErrorMessage(error)} (next in ${nextDelayMs}ms)`,
        );
      },
    },
  );
}

function toNewsRow(entry: NewsReference, existing?: NewsRowRecord) {
  return {
    slug: entry.slug,
    published_at: entry.publishedAt,
    source_name: entry.sourceName,
    source_url: entry.sourceUrl,
    image_url: entry.imageUrl ?? null,
    category: entry.category ?? null,
    tags: entry.tags,
    related_project_slugs: entry.relatedProjectSlugs,
    locales: entry.locales,
    editorial_analysis: existing?.editorial_analysis ?? null,
    is_active: existing?.is_active ?? true,
    posted_to_x_at: existing?.posted_to_x_at ?? null,
    posted_to_linkedin_at: existing?.posted_to_linkedin_at ?? null,
    x_post_status: existing?.x_post_status ?? null,
    x_attempt_count: existing?.x_attempt_count ?? null,
    x_last_attempt_at: existing?.x_last_attempt_at ?? null,
    x_next_retry_at: existing?.x_next_retry_at ?? null,
    x_last_error: existing?.x_last_error ?? null,
    x_external_post_id: existing?.x_external_post_id ?? null,
    linkedin_post_status: existing?.linkedin_post_status ?? null,
    linkedin_attempt_count: existing?.linkedin_attempt_count ?? null,
    linkedin_last_attempt_at: existing?.linkedin_last_attempt_at ?? null,
    linkedin_next_retry_at: existing?.linkedin_next_retry_at ?? null,
    linkedin_last_error: existing?.linkedin_last_error ?? null,
    linkedin_external_post_id: existing?.linkedin_external_post_id ?? null,
    created_at: existing?.created_at ?? null,
    updated_at: existing?.updated_at ?? null,
  };
}

async function main() {
  const missingDatabaseEnv = getRequiredWriteDatabaseEnvKeys().filter((key) => !process.env[key]);

  if (missingDatabaseEnv.length > 0) {
    console.error(`ERROR: Missing required database env vars: ${missingDatabaseEnv.join(", ")}`);
    process.exit(1);
  }

  const catalogPath = path.join(process.cwd(), "content", "sources", "news-feeds.json");
  const rawCatalog = await fs.readFile(catalogPath, "utf8");
  const sources = feedCatalogSchema.parse(JSON.parse(rawCatalog));

  const items: NewsReference[] = [];
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
          slug: buildStableNewsSlug(source.slug, sourceUrl, title),
          publishedAt: normalizePublishedAt(item.isoDate ?? item.pubDate),
          sourceName: source.sourceName,
          sourceUrl,
          imageUrl: source.defaultImageUrl,
          category: source.category,
          tags: detectTags(source.tags, title, excerpt),
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

  const sorted = items
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt))
    .slice(0, 56);

  if (sorted.length === 0) {
    console.log("No news items fetched from feeds.");
    return;
  }

  const existingRowBySourceUrl = new Map<string, NewsRowRecord>();
  const primaryExistingRows = await getExistingNewsRowsBySourceUrls(sorted.map((item) => item.sourceUrl));
  const secondaryProvider = getSecondaryDatabaseProvider();
  const secondaryExistingRows = secondaryProvider
    ? await getExistingNewsRowsBySourceUrls(sorted.map((item) => item.sourceUrl), secondaryProvider)
    : [];

  for (const row of [...primaryExistingRows, ...secondaryExistingRows]) {
    existingRowBySourceUrl.set(row.source_url, {
      ...row,
      editorial_analysis:
        row.editorial_analysis ?? existingRowBySourceUrl.get(row.source_url)?.editorial_analysis ?? null,
      posted_to_x_at: row.posted_to_x_at ?? existingRowBySourceUrl.get(row.source_url)?.posted_to_x_at ?? null,
      posted_to_linkedin_at:
        row.posted_to_linkedin_at ?? existingRowBySourceUrl.get(row.source_url)?.posted_to_linkedin_at ?? null,
      x_post_status: row.x_post_status ?? existingRowBySourceUrl.get(row.source_url)?.x_post_status ?? null,
      x_attempt_count: row.x_attempt_count ?? existingRowBySourceUrl.get(row.source_url)?.x_attempt_count ?? null,
      x_last_attempt_at:
        row.x_last_attempt_at ?? existingRowBySourceUrl.get(row.source_url)?.x_last_attempt_at ?? null,
      x_next_retry_at:
        row.x_next_retry_at ?? existingRowBySourceUrl.get(row.source_url)?.x_next_retry_at ?? null,
      x_last_error: row.x_last_error ?? existingRowBySourceUrl.get(row.source_url)?.x_last_error ?? null,
      x_external_post_id:
        row.x_external_post_id ?? existingRowBySourceUrl.get(row.source_url)?.x_external_post_id ?? null,
      linkedin_post_status:
        row.linkedin_post_status ?? existingRowBySourceUrl.get(row.source_url)?.linkedin_post_status ?? null,
      linkedin_attempt_count:
        row.linkedin_attempt_count ?? existingRowBySourceUrl.get(row.source_url)?.linkedin_attempt_count ?? null,
      linkedin_last_attempt_at:
        row.linkedin_last_attempt_at ?? existingRowBySourceUrl.get(row.source_url)?.linkedin_last_attempt_at ?? null,
      linkedin_next_retry_at:
        row.linkedin_next_retry_at ?? existingRowBySourceUrl.get(row.source_url)?.linkedin_next_retry_at ?? null,
      linkedin_last_error:
        row.linkedin_last_error ?? existingRowBySourceUrl.get(row.source_url)?.linkedin_last_error ?? null,
      linkedin_external_post_id:
        row.linkedin_external_post_id ?? existingRowBySourceUrl.get(row.source_url)?.linkedin_external_post_id ?? null,
      created_at: row.created_at ?? existingRowBySourceUrl.get(row.source_url)?.created_at ?? null,
      updated_at: row.updated_at ?? existingRowBySourceUrl.get(row.source_url)?.updated_at ?? null,
    });
  }

  const rows = sorted.map((item) =>
    toNewsRow(
      {
      ...item,
      slug: existingRowBySourceUrl.get(item.sourceUrl)?.slug ?? item.slug,
      },
      existingRowBySourceUrl.get(item.sourceUrl),
    ),
  );

  const data = await upsertNewsRows(rows);

  console.log(`SUCCESS: ${data.length} news items upserted into the primary database (zero commits needed)`);

  try {
    const activeRows = await listActiveNewsRows();
    await writeNewsSnapshot(
      activeRows.map((row) =>
        newsSchema.parse({
          slug: row.slug,
          publishedAt: row.published_at,
          sourceName: row.source_name,
          sourceUrl: row.source_url,
          imageUrl: row.image_url,
          category: row.category,
          tags: row.tags,
          relatedProjectSlugs: row.related_project_slugs,
          editorialAnalysis: row.editorial_analysis ?? null,
          locales: row.locales,
        }),
      ),
    );
  } catch (snapshotError) {
    console.warn(`WARNING: failed to refresh news snapshot after sync: ${toErrorMessage(snapshotError)}`);
  }

  await notifyIndexNow(rows.map((item) => item.slug));
}

const INDEXNOW_KEY = process.env.INDEXNOW_KEY;
const SITE_HOST = "michael.business";

async function notifyIndexNow(slugs: string[]): Promise<void> {
  if (!INDEXNOW_KEY || slugs.length === 0) {
    return;
  }

  const urlList = Array.from(new Set(slugs)).flatMap((slug) => [
    `https://${SITE_HOST}/en/news/${slug}`,
    `https://${SITE_HOST}/pt/news/${slug}`,
  ]);

  urlList.push(`https://${SITE_HOST}/en/news`, `https://${SITE_HOST}/pt/news`);

  for (const batch of chunkArray(urlList, 100)) {
    try {
      const response = await withRetry(
        async () => {
          const response = await fetchWithTimeout("https://api.indexnow.org/IndexNow", {
            timeoutMs: 10_000,
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              host: SITE_HOST,
              key: INDEXNOW_KEY,
              keyLocation: `https://${SITE_HOST}/${INDEXNOW_KEY}.txt`,
              urlList: batch,
            }),
          });

          if (response.status >= 500 || response.status === 429) {
            throw new Error(`IndexNow request failed with status ${response.status}`);
          }

          return response;
        },
        {
          attempts: 3,
          delayMs: 1_000,
          shouldRetry: (error) => {
            const message = toErrorMessage(error);
            return message.includes("aborted") || message.includes("status 429") || message.includes("status 5");
          },
        },
      );

      console.log(`IndexNow: submitted ${batch.length} URLs (status ${response.status})`);
    } catch (indexNowError) {
      console.warn("IndexNow notification failed:", toErrorMessage(indexNowError));
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
