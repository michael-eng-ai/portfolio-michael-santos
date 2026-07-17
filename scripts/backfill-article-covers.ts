/**
 * Backfill missing article cover images via Gemini.
 *
 * Usage:
 *   set -a && source .env.worker.local && set +a
 *   pnpm tsx scripts/backfill-article-covers.ts
 *   pnpm tsx scripts/backfill-article-covers.ts --since=2026-07-01 --limit=10
 *   pnpm tsx scripts/backfill-article-covers.ts --dry-run
 *
 * Never prints secret values. Requires GEMINI_API_KEY.
 */
import { promises as fs } from "node:fs";
import path from "node:path";

import { findLocalArticleCoverUrl, isRasterArticleCover } from "@/lib/article-covers";
import { getArticles } from "@/lib/content";
import { generateCoverImage } from "@/lib/image-gen";
import { generateLocalCoverImage } from "@/lib/local-cover";

type CliOptions = {
  since?: string;
  limit?: number;
  dryRun: boolean;
  slug?: string;
  localFallback: boolean;
  localOnly: boolean;
};

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { dryRun: false, localFallback: true, localOnly: false };

  for (const arg of argv) {
    if (arg === "--" || !arg) {
      continue;
    }
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    if (arg === "--local-only") {
      options.localOnly = true;
      continue;
    }
    if (arg === "--no-local-fallback") {
      options.localFallback = false;
      continue;
    }
    if (arg.startsWith("--since=")) {
      options.since = arg.slice("--since=".length);
      continue;
    }
    if (arg.startsWith("--limit=")) {
      options.limit = Number(arg.slice("--limit=".length));
      continue;
    }
    if (arg.startsWith("--slug=")) {
      options.slug = arg.slice("--slug=".length);
    }
  }

  return options;
}

async function persistImageUrl(slug: string, imageUrl: string) {
  const target = path.join(process.cwd(), "content", "articles", `${slug}.json`);
  const raw = await fs.readFile(target, "utf8");
  const article = JSON.parse(raw) as Record<string, unknown>;
  article.imageUrl = imageUrl;
  await fs.writeFile(target, `${JSON.stringify(article, null, 2)}\n`, "utf8");
}

function githubWarning(message: string) {
  console.warn(`::warning title=Article cover::${message}`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const hasKey = Boolean(process.env.GEMINI_API_KEY) && !options.localOnly;

  if (!hasKey && !options.localFallback && !options.dryRun) {
    githubWarning("GEMINI_API_KEY is not set and local fallback is disabled.");
    console.error("Set GEMINI_API_KEY, enable local fallback, or pass --dry-run.");
    process.exit(1);
  }

  const articles = await getArticles();
  const candidates = articles
    .filter((article) => (options.slug ? article.slug === options.slug : true))
    .filter((article) => (options.since ? article.publishedAt >= options.since : true))
    .filter((article) => {
      const local = findLocalArticleCoverUrl(article.slug);
      return !local && !isRasterArticleCover(article.imageUrl);
    })
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));

  const selected = typeof options.limit === "number" ? candidates.slice(0, options.limit) : candidates;

  console.log(
    `Cover backfill: ${selected.length} article(s) missing raster covers` +
      `${options.since ? ` since ${options.since}` : ""}` +
      `${options.dryRun ? " (dry-run)" : ""}` +
      `${!hasKey ? " (local-fallback only)" : ""}.`,
  );

  if (selected.length === 0) {
    return;
  }

  let generated = 0;
  let failed = 0;

  for (const article of selected) {
    const prompt = `${article.locales.en.title}. ${article.locales.en.excerpt}. Tags: ${article.tags.join(", ")}.`;
    console.log(`→ ${article.publishedAt} ${article.slug}`);

    if (options.dryRun) {
      continue;
    }

    try {
      let cover;
      if (hasKey) {
        try {
          cover = await generateCoverImage({ slug: article.slug, prompt });
        } catch (error) {
          if (!options.localFallback) {
            throw error;
          }
          const message = error instanceof Error ? error.message : String(error);
          console.warn(`  Gemini failed (${message.slice(0, 140)}); using local branded PNG fallback.`);
          cover = await generateLocalCoverImage({
            slug: article.slug,
            title: article.locales.en.title,
            eyebrow: article.category.en,
          });
        }
      } else {
        cover = await generateLocalCoverImage({
          slug: article.slug,
          title: article.locales.en.title,
          eyebrow: article.category.en,
        });
      }

      await persistImageUrl(article.slug, cover.publicUrl);
      generated += 1;
      console.log(
        `  OK ${cover.model} ${(cover.bytes / 1024).toFixed(0)}KB → ${cover.publicUrl}`,
      );
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      githubWarning(`Failed cover for ${article.slug}: ${message.slice(0, 180)}`);
      console.warn(`  FAIL ${message.slice(0, 240)}`);
    }
  }

  console.log(`Done. generated=${generated} failed=${failed} dryRun=${options.dryRun}`);

  if (failed > 0 && generated === 0 && !options.dryRun) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
