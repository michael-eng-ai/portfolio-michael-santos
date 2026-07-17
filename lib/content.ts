import { promises as fs } from "node:fs";
import path from "node:path";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { z } from "zod";

import {
  getActiveNewsPresence,
  listActiveNewsRows,
} from "@/lib/database";
import { resolveArticleImage, resolveNewsImage, resolveProjectImage } from "@/lib/editorial-images";
import { toErrorMessage } from "@/lib/runtime";

export const localizedTextSchema = z.object({
  en: z.string().min(1),
  pt: z.string().min(1),
});

function isValidAssetUrl(value: string) {
  if (value.startsWith("/")) {
    return true;
  }

  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export const assetUrlSchema = z.string().min(1).refine(isValidAssetUrl, {
  message: "Expected an absolute URL or root-relative asset path",
});

const localizedProjectSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().min(1),
  summary: z.string().min(1),
  businessProblem: z.string().min(1),
  technicalSolution: z.array(z.string().min(1)).min(1),
  architectureSummary: z.string().min(1),
  impact: z.array(z.string().min(1)).min(1),
  body: z.string().min(1),
});

const localizedArticleSchema = z.object({
  title: z.string().min(1),
  excerpt: z.string().min(1),
  body: z.string().min(1),
});

const localizedNewsSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  whyItMatters: z.string().min(1),
});

const localizedLinkedinSchema = z.object({
  hook: z.string().min(1),
  body: z.string().min(1),
  cta: z.string().min(1),
});

const localizedXSchema = z.object({
  posts: z.array(z.string().min(1)).min(1).max(3),
});

const channelStrategySchema = z.object({
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
  }).optional(),
});

export const projectSchema = z.object({
  slug: z.string().min(1),
  featured: z.boolean().default(false),
  order: z.number().int().default(999),
  imageUrl: assetUrlSchema.optional(),
  stack: z.array(z.string().min(1)).min(1),
  tags: z.array(z.string().min(1)).default([]),
  github: z.object({
    owner: z.string().min(1),
    repo: z.string().min(1),
    url: z.string().url(),
  }),
  channelStrategy: channelStrategySchema.optional(),
  relatedArticleSlugs: z.array(z.string().min(1)).default([]),
  relatedNewsSlugs: z.array(z.string().min(1)).default([]),
  locales: z.object({
    en: localizedProjectSchema,
    pt: localizedProjectSchema,
  }),
});

export const articleSchema = z.object({
  slug: z.string().min(1),
  publishedAt: z.string().min(1),
  featured: z.boolean().default(false),
  imageUrl: assetUrlSchema.optional(),
  category: localizedTextSchema,
  tags: z.array(z.string().min(1)).default([]),
  readingMinutes: z.number().int().positive(),
  channelStrategy: channelStrategySchema.optional(),
  relatedProjectSlugs: z.array(z.string().min(1)).default([]),
  relatedNewsSlugs: z.array(z.string().min(1)).default([]),
  locales: z.object({
    en: localizedArticleSchema,
    pt: localizedArticleSchema,
  }),
});

export const newsSchema = z.object({
  slug: z.string().min(1),
  publishedAt: z.string().min(1),
  sourceName: z.string().min(1),
  sourceUrl: z.string().url(),
  imageUrl: assetUrlSchema.nullable().optional(),
  category: localizedTextSchema.nullable().optional(),
  tags: z.array(z.string().min(1)).default([]),
  relatedProjectSlugs: z.array(z.string().min(1)).default([]),
  editorialAnalysis: z.object({ en: z.string(), pt: z.string() }).nullable().optional(),
  locales: z.object({
    en: localizedNewsSchema,
    pt: localizedNewsSchema,
  }),
});

export const newsFeedSourceSchema = z.object({
  slug: z.string().min(1),
  sourceName: z.string().min(1),
  homepageUrl: z.string().url(),
  feedUrl: z.string().url(),
  defaultImageUrl: assetUrlSchema.optional(),
  category: localizedTextSchema.optional(),
  tags: z.array(z.string().min(1)).default([]),
  relatedProjectSlugs: z.array(z.string().min(1)).default([]),
  topic: localizedTextSchema,
  whyItMatters: localizedTextSchema,
  maxItems: z.number().int().positive().default(4),
});

export const newsFeedCatalogSchema = z.array(newsFeedSourceSchema);

export const linkedinDraftSchema = z.object({
  slug: z.string().min(1),
  sourceType: z.enum(["article", "project"]),
  sourceSlug: z.string().min(1),
  status: z.enum(["draft", "approved", "published"]),
  generatedAt: z.string().min(1),
  publishedUrl: z.string().url().nullable().default(null),
  /** Optional root-relative cover path for IMAGE share when OG scrape is weak. */
  mediaPath: z.string().min(1).nullable().optional(),
  urls: z.object({
    en: z.string().url(),
    pt: z.string().url(),
    proof: z.string().url().nullable().default(null),
  }),
  locales: z.object({
    en: localizedLinkedinSchema,
    pt: localizedLinkedinSchema,
  }),
});

export const xDraftSchema = z.object({
  slug: z.string().min(1),
  sourceType: z.enum(["article", "project"]),
  sourceSlug: z.string().min(1),
  status: z.enum(["draft", "approved", "published"]),
  generatedAt: z.string().min(1),
  publishedUrl: z.string().url().nullable().default(null),
  /** Optional root-relative cover path for media upload on publish. */
  mediaPath: z.string().min(1).nullable().optional(),
  urls: z.object({
    en: z.string().url(),
    pt: z.string().url(),
    proof: z.string().url().nullable().default(null),
  }),
  locales: z.object({
    en: localizedXSchema,
    pt: localizedXSchema,
  }),
});

export const githubRepoSnapshotSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  description: z.string().nullable(),
  homepage: z.string().nullable(),
  stars: z.number().int().nonnegative(),
  forks: z.number().int().nonnegative(),
  openIssues: z.number().int().nonnegative(),
  topics: z.array(z.string()),
  defaultBranch: z.string().min(1),
  pushedAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
});

const githubSnapshotFileSchema = z.object({
  syncedAt: z.string().min(1),
  repos: z.array(githubRepoSnapshotSchema),
});

export const generatedNewsFileSchema = z.object({
  syncedAt: z.string().min(1),
  items: z.array(newsSchema),
});

export type Project = z.infer<typeof projectSchema>;
export type Article = z.infer<typeof articleSchema>;
export type NewsReference = z.infer<typeof newsSchema>;
export type NewsFeedSource = z.infer<typeof newsFeedSourceSchema>;
export type LinkedinDraft = z.infer<typeof linkedinDraftSchema>;
export type XDraft = z.infer<typeof xDraftSchema>;
export type GithubRepoSnapshot = z.infer<typeof githubRepoSnapshotSchema>;

const contentRoot = path.join(process.cwd(), "content");

async function readJsonCollection<T>(
  directory: string,
  schema: z.ZodSchema<T>,
): Promise<T[]> {
  const absoluteDirectory = path.join(contentRoot, directory);
  const files = await fs.readdir(absoluteDirectory);
  const jsonFiles = files.filter((file) => file.endsWith(".json")).sort();

  const entries = await Promise.all(
    jsonFiles.map(async (file) => {
      const absoluteFile = path.join(absoluteDirectory, file);
      const raw = await fs.readFile(absoluteFile, "utf8");
      return schema.parse(JSON.parse(raw));
    }),
  );

  return entries;
}

async function readJsonFile<T>(filePath: string, schema: z.ZodSchema<T>) {
  const raw = await fs.readFile(filePath, "utf8");
  return schema.parse(JSON.parse(raw));
}

function sortNewsByPublishedAtDesc(entries: NewsReference[]) {
  return [...entries].sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
}

function hydrateProject(entry: Project): Project {
  return {
    ...entry,
    imageUrl: resolveProjectImage({
      slug: entry.slug,
      imageUrl: entry.imageUrl,
      tags: entry.tags,
      stack: entry.stack,
    }),
  };
}

function hydrateArticle(entry: Article): Article {
  return {
    ...entry,
    imageUrl: resolveArticleImage({
      slug: entry.slug,
      imageUrl: entry.imageUrl,
      tags: entry.tags,
      category: entry.category,
    }),
  };
}

function hydrateNews(entry: NewsReference): NewsReference {
  return {
    ...entry,
    imageUrl: resolveNewsImage({
      slug: entry.slug,
      imageUrl: entry.imageUrl,
      tags: entry.tags,
      category: entry.category ?? undefined,
      sourceName: entry.sourceName,
      relatedProjectSlugs: entry.relatedProjectSlugs,
    }),
  };
}

async function readFallbackNewsReferences(): Promise<NewsReference[]> {
  const fallbackBySourceUrl = new Map<string, NewsReference>();

  try {
    const payload = await readJsonFile(
      path.join(contentRoot, "generated", "news.json"),
      generatedNewsFileSchema,
    );

    for (const item of payload.items) {
      fallbackBySourceUrl.set(item.sourceUrl, hydrateNews(item));
    }
  } catch {
    // Snapshot is optional.
  }

  try {
    const manualEntries = await readJsonCollection("news", newsSchema);
    for (const item of manualEntries) {
      fallbackBySourceUrl.set(item.sourceUrl, hydrateNews(item));
    }
  } catch {
    // Manual fallback is optional too.
  }

  return sortNewsByPublishedAtDesc(Array.from(fallbackBySourceUrl.values()));
}

export async function getProjects() {
  const entries = await readJsonCollection("projects", projectSchema);
  return entries.map(hydrateProject).sort((left, right) => left.order - right.order);
}

export async function getProjectBySlug(slug: string) {
  const entries = await getProjects();
  return entries.find((entry) => entry.slug === slug) ?? null;
}

export async function getArticles() {
  const entries = await readJsonCollection("articles", articleSchema);
  return entries.map(hydrateArticle).sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
}

export async function getArticleBySlug(slug: string) {
  const entries = await getArticles();
  return entries.find((entry) => entry.slug === slug) ?? null;
}

function mapNewsRow(row: Record<string, unknown>): NewsReference {
  return hydrateNews(newsSchema.parse({
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
  }));
}

async function fetchNewsReferencesFromSource(): Promise<NewsReference[]> {
  try {
    const results: NewsReference[] = [];
    for (const row of await listActiveNewsRows()) {
      try {
        results.push(mapNewsRow(row));
      } catch (parseError) {
        console.error("Skipping invalid news row", {
          event: "database_news_parse_error",
          slug: (row as Record<string, unknown>).slug,
          error: parseError,
        });
      }
    }

    if (results.length === 0) {
      return await readFallbackNewsReferences();
    }

    return sortNewsByPublishedAtDesc(results);
  } catch (fetchError) {
    console.error("Unexpected error fetching news", { event: "database_news_unexpected_error", error: fetchError });
    return await readFallbackNewsReferences();
  }
}

// The full active news table is read by every page (home, each news/article/project
// detail). Pulling it once per render multiplies database egress and is what tripped
// the database egress quota. Wrap the source read in two cache layers:
//  - `unstable_cache` shares one result across all requests/paths for NEWS_CACHE_TTL,
//    so the full table is fetched at most once per window globally instead of per path.
//  - React `cache` deduplicates the repeated calls within a single render pass.
// Override the window with NEWS_CACHE_TTL_SECONDS (defaults to 600s / 10 min).
const NEWS_CACHE_TTL_SECONDS =
  Number.parseInt(process.env.NEWS_CACHE_TTL_SECONDS ?? "", 10) || 600;

const loadNewsReferences = cache(
  unstable_cache(fetchNewsReferencesFromSource, ["news-references"], {
    revalidate: NEWS_CACHE_TTL_SECONDS,
    tags: ["news"],
  }),
);

export async function getNewsReferences(): Promise<NewsReference[]> {
  try {
    return await loadNewsReferences();
  } catch (error) {
    // Next's `unstable_cache` throws "Invariant: incrementalCache missing" when
    // invoked outside the Next.js server runtime — e.g. from a standalone tsx
    // content script (generateDailyArticle, etc.). Fall back to the uncached
    // source so those scripts keep working; the cache layer still applies
    // during normal server rendering.
    if (error instanceof Error && error.message.includes("incrementalCache")) {
      console.warn("[content] getNewsReferences called outside the Next.js cache; using uncached source.");
      return fetchNewsReferencesFromSource();
    }

    throw error;
  }
}

export async function getNewsReferenceBySlug(slug: string): Promise<NewsReference | null> {
  // Reuse the cached active-news list (same `is_active = true` set) so a detail view
  // does not issue an extra single-row query and inflate database egress.
  const cached = (await getNewsReferences()).find((entry) => entry.slug === slug);

  if (cached) {
    return cached;
  }

  const fallbackEntries = await readFallbackNewsReferences();
  return fallbackEntries.find((entry) => entry.slug === slug) ?? null;
}

export async function getNewsHealthStatus() {
  const fallbackEntries = await readFallbackNewsReferences();

  try {
    const activeCount = await getActiveNewsPresence();

    return {
      ok: true,
      source: "postgres" as const,
      activeCount,
      fallbackCount: fallbackEntries.length,
    };
  } catch (error) {
    return {
      ok: false,
      source: "fallback" as const,
      fallbackCount: fallbackEntries.length,
      error: toErrorMessage(error),
    };
  }
}

export async function getLinkedinDrafts() {
  try {
    const entries = await readJsonCollection("linkedin", linkedinDraftSchema);
    return entries.sort((left, right) => right.generatedAt.localeCompare(left.generatedAt));
  } catch {
    return [];
  }
}

export async function getXDrafts() {
  try {
    const entries = await readJsonCollection("x", xDraftSchema);
    return entries.sort((left, right) => right.generatedAt.localeCompare(left.generatedAt));
  } catch {
    return [];
  }
}

export async function getGithubRepoSnapshots() {
  try {
    const payload = await readJsonFile(
      path.join(contentRoot, "generated", "github-repos.json"),
      githubSnapshotFileSchema,
    );
    return payload.repos;
  } catch {
    return [];
  }
}


export function getGithubSnapshotForProject(
  project: Project,
  snapshots: GithubRepoSnapshot[],
) {
  return (
    snapshots.find(
      (snapshot) =>
        snapshot.owner === project.github.owner && snapshot.repo === project.github.repo,
    ) ?? null
  );
}
