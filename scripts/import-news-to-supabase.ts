/**
 * One-shot migration script: imports news from JSON files into Supabase.
 * Reads content/news/*.json (manual) and content/generated/news.json (generated),
 * merges them (manual takes priority), validates with Zod, and upserts into Supabase.
 *
 * Usage: npx tsx scripts/import-news-to-supabase.ts
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { newsSchema, generatedNewsFileSchema, type NewsReference } from "../lib/content";
import { sanitizeNewsReference } from "../lib/news-utils";

const contentRoot = path.join(process.cwd(), "content");

async function readManualNews(): Promise<NewsReference[]> {
  const directory = path.join(contentRoot, "news");

  try {
    const files = await fs.readdir(directory);
    const jsonFiles = files.filter((file) => file.endsWith(".json")).sort();

    const entries = await Promise.all(
      jsonFiles.map(async (file) => {
        const raw = await fs.readFile(path.join(directory, file), "utf8");
        return newsSchema.parse(JSON.parse(raw));
      }),
    );

    return entries;
  } catch {
    return [];
  }
}

async function readGeneratedNews(): Promise<NewsReference[]> {
  const filePath = path.join(contentRoot, "generated", "news.json");

  try {
    const raw = await fs.readFile(filePath, "utf8");
    const payload = generatedNewsFileSchema.parse(JSON.parse(raw));
    return payload.items;
  } catch {
    return [];
  }
}

function toSupabaseRow(entry: NewsReference) {
  const normalizedEntry = sanitizeNewsReference(entry);

  return {
    slug: normalizedEntry.slug,
    published_at: normalizedEntry.publishedAt,
    source_name: normalizedEntry.sourceName,
    source_url: normalizedEntry.sourceUrl,
    image_url: normalizedEntry.imageUrl ?? null,
    category: normalizedEntry.category ?? null,
    tags: normalizedEntry.tags,
    related_project_slugs: normalizedEntry.relatedProjectSlugs,
    locales: normalizedEntry.locales,
    is_active: true,
  };
}

async function main(): Promise<void> {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    console.error("ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
    process.exit(1);
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log("Reading news from JSON files...");

  const [manualEntries, generatedEntries] = await Promise.all([
    readManualNews(),
    readGeneratedNews(),
  ]);

  console.log(`  Manual entries: ${manualEntries.length}`);
  console.log(`  Generated entries: ${generatedEntries.length}`);

  const merged = new Map<string, NewsReference>();

  for (const entry of [...generatedEntries, ...manualEntries]) {
    merged.set(entry.sourceUrl, entry);
  }

  const allEntries = Array.from(merged.values());
  console.log(`  Merged (deduplicated): ${allEntries.length}`);

  if (allEntries.length === 0) {
    console.log("No news entries to import.");
    return;
  }

  const rows = allEntries.map(toSupabaseRow);

  const { data, error } = await supabase
    .from("news")
    .upsert(rows, { onConflict: "source_url" })
    .select("slug");

  if (error) {
    console.error("ERROR: Supabase upsert failed", error.message);
    process.exit(1);
  }

  console.log(`SUCCESS: ${data.length} news entries upserted into Supabase`);
}

main();
