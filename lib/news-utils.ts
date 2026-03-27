import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import type { NewsReference } from "@/lib/content";

const GENERATED_NEWS_SNAPSHOT_PATH = path.join(process.cwd(), "content", "generated", "news.json");

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildReadableSlugSeed(sourceUrl: string, title: string) {
  try {
    const url = new URL(sourceUrl);
    const segments = url.pathname.split("/").filter(Boolean);
    const candidate = segments
      .slice(-2)
      .map((segment) => slugify(segment))
      .filter(Boolean)
      .join("-");

    if (candidate) {
      return candidate;
    }
  } catch {
    // Fall back to title-derived seed below.
  }

  return slugify(title) || "item";
}

export function buildStableNewsSlug(sourceSlug: string, sourceUrl: string, title: string) {
  const seed = buildReadableSlugSeed(sourceUrl, title).slice(0, 60);
  const hash = createHash("sha1").update(sourceUrl).digest("hex").slice(0, 8);
  return `${sourceSlug}-${seed}-${hash}`;
}

export function normalizePublishedAt(value?: string) {
  if (!value) {
    return new Date().toISOString();
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }

  return parsed.toISOString();
}

function buildRegex(keyword: string) {
  const escaped = keyword
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\s+/g, "\\s+");

  return new RegExp(`\\b${escaped}\\b`, "i");
}

export function detectTags(sourceTags: string[], title: string, excerpt: string) {
  const detected = new Set(sourceTags);
  const haystack = `${title} ${excerpt}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const keywordMap: Array<[string, string[]]> = [
    ["ai", ["ai", "llm", "genai", "agent", "copilot", "artificial intelligence", "gpt", "claude", "gemini"]],
    ["lakehouse", ["lakehouse", "delta lake", "iceberg", "hudi"]],
    ["dbt", ["dbt", "analytics engineering"]],
    ["kafka", ["kafka", "debezium"]],
    ["streaming", ["streaming", "real time", "realtime", "event driven"]],
    ["governance", ["governance", "governed", "compliance", "lineage", "data quality"]],
    ["snowflake", ["snowflake"]],
    ["bigquery", ["bigquery"]],
    ["databricks", ["databricks", "spark", "pyspark"]],
    ["mlops", ["mlops", "ml ops", "model registry", "feature store", "ml pipeline"]],
    ["llm", ["large language", "llm", "transformer", "fine tun"]],
    ["genai", ["generative ai", "genai", "gen ai"]],
    ["rag", ["rag", "retrieval augmented", "vector search", "embedding"]],
    ["python", ["python", "pandas", "polars", "pydantic"]],
    ["open-source", ["open source", "open-source", "oss"]],
    ["aws", ["aws", "amazon web services", "redshift", "sagemaker", "glue"]],
    ["gcp", ["gcp", "google cloud", "vertex ai", "bigtable"]],
  ];

  for (const [tag, keywords] of keywordMap) {
    if (keywords.some((keyword) => buildRegex(keyword).test(haystack))) {
      detected.add(tag);
    }
  }

  return Array.from(detected).slice(0, 6);
}

export async function writeNewsSnapshot(items: NewsReference[]) {
  await fs.mkdir(path.dirname(GENERATED_NEWS_SNAPSHOT_PATH), { recursive: true });
  await fs.writeFile(
    GENERATED_NEWS_SNAPSHOT_PATH,
    `${JSON.stringify({ syncedAt: new Date().toISOString(), items }, null, 2)}\n`,
    "utf8",
  );
}

export function getGeneratedNewsSnapshotPath() {
  return GENERATED_NEWS_SNAPSHOT_PATH;
}
