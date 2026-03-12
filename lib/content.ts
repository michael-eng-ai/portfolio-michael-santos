import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";

export const localizedTextSchema = z.object({
  en: z.string().min(1),
  pt: z.string().min(1),
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
});

export const projectSchema = z.object({
  slug: z.string().min(1),
  featured: z.boolean().default(false),
  order: z.number().int().default(999),
  imageUrl: z.string().url().optional(),
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
  imageUrl: z.string().url().optional(),
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
  imageUrl: z.string().url().optional(),
  category: localizedTextSchema.optional(),
  tags: z.array(z.string().min(1)).default([]),
  relatedProjectSlugs: z.array(z.string().min(1)).default([]),
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
  defaultImageUrl: z.string().url().optional(),
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
  locales: z.object({
    en: localizedLinkedinSchema,
    pt: localizedLinkedinSchema,
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

export async function getProjects() {
  const entries = await readJsonCollection("projects", projectSchema);
  return entries.sort((left, right) => left.order - right.order);
}

export async function getProjectBySlug(slug: string) {
  const entries = await getProjects();
  return entries.find((entry) => entry.slug === slug) ?? null;
}

export async function getArticles() {
  const entries = await readJsonCollection("articles", articleSchema);
  return entries.sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
}

export async function getArticleBySlug(slug: string) {
  const entries = await getArticles();
  return entries.find((entry) => entry.slug === slug) ?? null;
}

export async function getNewsReferences() {
  const [manualEntries, generatedEntries] = await Promise.all([
    readJsonCollection("news", newsSchema).catch(() => []),
    getGeneratedNewsReferences(),
  ]);

  const mergedEntries = new Map<string, NewsReference>();

  for (const entry of [...manualEntries, ...generatedEntries]) {
    mergedEntries.set(entry.sourceUrl, entry);
  }

  return Array.from(mergedEntries.values()).sort((left, right) =>
    right.publishedAt.localeCompare(left.publishedAt),
  );
}

export async function getNewsReferenceBySlug(slug: string) {
  const entries = await getNewsReferences();
  return entries.find((entry) => entry.slug === slug) ?? null;
}

export async function getLinkedinDrafts() {
  try {
    const entries = await readJsonCollection("linkedin", linkedinDraftSchema);
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

export async function getGeneratedNewsReferences() {
  try {
    const payload = await readJsonFile(
      path.join(contentRoot, "generated", "news.json"),
      generatedNewsFileSchema,
    );
    return payload.items;
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
