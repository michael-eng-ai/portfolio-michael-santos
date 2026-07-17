/**
 * Soft editorial gate: warn (and optionally fail) when recent articles lack raster covers.
 *
 * Usage:
 *   pnpm tsx scripts/check-article-covers.ts
 *   pnpm tsx scripts/check-article-covers.ts --since=2026-07-01 --strict-when-key
 */
import { findLocalArticleCoverUrl, isGenericSvgCover, isRasterArticleCover } from "@/lib/article-covers";
import { getArticles } from "@/lib/content";

type CliOptions = {
  since?: string;
  strictWhenKey: boolean;
};

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { strictWhenKey: false };
  for (const arg of argv) {
    if (arg === "--" || !arg) continue;
    if (arg === "--strict-when-key") {
      options.strictWhenKey = true;
    }
    if (arg.startsWith("--since=")) {
      options.since = arg.slice("--since=".length);
    }
  }
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const articles = await getArticles();
  const since = options.since ?? "2026-07-01";
  const missing = articles
    .filter((article) => article.publishedAt >= since)
    .filter((article) => {
      const local = findLocalArticleCoverUrl(article.slug);
      if (local) return false;
      if (isRasterArticleCover(article.imageUrl)) return false;
      return isGenericSvgCover(article.imageUrl) || !article.imageUrl;
    })
    .map((article) => `${article.publishedAt} ${article.slug}`);

  if (missing.length === 0) {
    console.log(`Cover check OK: all articles since ${since} have raster covers.`);
    return;
  }

  for (const item of missing) {
    console.warn(`::warning title=Missing article cover::${item}`);
    console.warn(`MISSING_COVER ${item}`);
  }

  console.warn(
    `Cover check: ${missing.length} article(s) since ${since} lack JPG/PNG covers (falling back to SVG).`,
  );

  const keyPresent = Boolean(process.env.GEMINI_API_KEY);
  if (options.strictWhenKey && keyPresent) {
    console.error(
      "GEMINI_API_KEY is configured but covers are missing. Run: pnpm tsx scripts/backfill-article-covers.ts --since=" +
        since,
    );
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
