import { promises as fs } from "node:fs";
import path from "node:path";

import {
  articleSchema,
  generatedNewsFileSchema,
  githubRepoSnapshotSchema,
  linkedinDraftSchema,
  newsFeedCatalogSchema,
  newsSchema,
  projectSchema,
} from "@/lib/content";

async function validateDirectory(directory: string, parser: { parse: (value: unknown) => unknown }) {
  const absoluteDirectory = path.join(process.cwd(), "content", directory);
  const files = await fs.readdir(absoluteDirectory);
  const jsonFiles = files.filter((file) => file.endsWith(".json"));

  for (const file of jsonFiles) {
    const raw = await fs.readFile(path.join(absoluteDirectory, file), "utf8");
    parser.parse(JSON.parse(raw));
  }

  return jsonFiles.length;
}

async function main() {
  const projectCount = await validateDirectory("projects", projectSchema);
  const articleCount = await validateDirectory("articles", articleSchema);
  const newsCount = await validateDirectory("news", newsSchema);
  const linkedinCount = await validateDirectory("linkedin", linkedinDraftSchema);
  const sourcesRaw = await fs.readFile(
    path.join(process.cwd(), "content", "sources", "news-feeds.json"),
    "utf8",
  );
  const sources = newsFeedCatalogSchema.parse(JSON.parse(sourcesRaw));

  const generatedNewsRaw = await fs.readFile(
    path.join(process.cwd(), "content", "generated", "news.json"),
    "utf8",
  );
  const generatedNews = generatedNewsFileSchema.parse(JSON.parse(generatedNewsRaw));

  const githubSnapshotRaw = await fs.readFile(
    path.join(process.cwd(), "content", "generated", "github-repos.json"),
    "utf8",
  );
  const snapshotPayload = JSON.parse(githubSnapshotRaw) as { syncedAt: string; repos: unknown[] };
  snapshotPayload.repos.forEach((entry) => githubRepoSnapshotSchema.parse(entry));

  console.log(
    `Validated ${projectCount} projects, ${articleCount} articles, ${newsCount} manual news references, ${generatedNews.items.length} generated news items, ${sources.length} feed sources, and ${linkedinCount} LinkedIn drafts.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
