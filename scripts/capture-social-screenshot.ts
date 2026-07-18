/**
 * Capture a proof URL into public/images/social/<slug>.png for signal drafts.
 *
 * Preferred: Playwright (optional). If playwright is not installed, prints
 * a manual capture checklist and exits 0 when --allow-missing-playwright is set.
 *
 * Usage:
 *   pnpm content:capture:social -- --url https://github.com/org/repo --slug 2026-07-17-repo
 *   pnpm content:capture:social -- --url https://example.com/docs --slug demo --dry-run
 */
import { createRequire } from "node:module";
import { promises as fs } from "node:fs";
import path from "node:path";

type CliOptions = {
  url?: string;
  slug?: string;
  dryRun: boolean;
  allowMissingPlaywright: boolean;
  fullPage: boolean;
};

type PlaywrightLike = {
  chromium: {
    launch: (options: { headless: boolean }) => Promise<{
      newPage: (options: {
        viewport: { width: number; height: number };
        deviceScaleFactor: number;
      }) => Promise<{
        goto: (url: string, options: { waitUntil: "networkidle"; timeout: number }) => Promise<unknown>;
        screenshot: (options: { path: string; fullPage: boolean; type: "png" }) => Promise<unknown>;
      }>;
      close: () => Promise<void>;
    }>;
  };
};

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    dryRun: false,
    allowMissingPlaywright: false,
    fullPage: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const raw = argv[index];
    const eq = raw.indexOf("=");
    const arg = eq === -1 ? raw : raw.slice(0, eq);
    const inline = eq === -1 ? undefined : raw.slice(eq + 1);
    const next = inline ?? argv[index + 1];
    const consumedSeparate = inline === undefined && Boolean(argv[index + 1]);

    if (arg === "--url" && next) {
      options.url = next;
      if (consumedSeparate) index += 1;
      continue;
    }
    if (arg === "--slug" && next) {
      options.slug = next.replace(/\.(png|jpe?g|webp)$/i, "");
      if (consumedSeparate) index += 1;
      continue;
    }
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    if (arg === "--allow-missing-playwright") {
      options.allowMissingPlaywright = true;
      continue;
    }
    if (arg === "--full-page") {
      options.fullPage = true;
    }
  }

  return options;
}

function targetPath(slug: string): string {
  return path.join(process.cwd(), "public", "images", "social", `${slug}.png`);
}

function printManualChecklist(url: string, outPath: string) {
  console.log("Playwright is not installed. Manual capture checklist:");
  console.log(`  1. Open ${url}`);
  console.log("  2. Capture the README / docs / UI proof (viewport or full page)");
  console.log(`  3. Save as ${outPath}`);
  console.log('  4. Ensure the LinkedIn/X draft has mediaSource: "screenshot" and matching mediaPath');
  console.log("  5. Human-approve (status: approved) before publish");
  console.log("Optional: pnpm add -D playwright && pnpm exec playwright install chromium");
}

function loadPlaywright(): PlaywrightLike {
  const require = createRequire(import.meta.url);
  return require("playwright") as PlaywrightLike;
}

async function captureWithPlaywright(url: string, outPath: string, fullPage: boolean) {
  const playwright = loadPlaywright();
  const browser = await playwright.chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 2,
    });
    await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await page.screenshot({ path: outPath, fullPage, type: "png" });
  } finally {
    await browser.close();
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (!options.url || !options.slug) {
    console.error("ERROR: --url <https://...> and --slug <file-slug> are required.");
    process.exit(1);
  }

  let parsed: URL;
  try {
    parsed = new URL(options.url);
  } catch {
    console.error("ERROR: --url must be a valid absolute URL.");
    process.exit(1);
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    console.error("ERROR: --url must use http or https.");
    process.exit(1);
  }

  const outPath = targetPath(options.slug);
  const mediaPath = `/images/social/${options.slug}.png`;

  if (options.dryRun) {
    console.log(`DRY_RUN: would capture ${options.url} -> ${outPath} (mediaPath=${mediaPath})`);
    return;
  }

  try {
    await captureWithPlaywright(options.url, outPath, options.fullPage);
    console.log(`Captured ${outPath}`);
    console.log(`Set draft mediaPath to "${mediaPath}" with mediaSource: "screenshot".`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const missingPlaywright =
      /Cannot find module ['"]playwright['"]/i.test(message) ||
      /Cannot find package ['"]playwright['"]/i.test(message);

    if (missingPlaywright) {
      printManualChecklist(options.url, outPath);
      if (options.allowMissingPlaywright) {
        process.exit(0);
      }
      process.exit(2);
    }

    console.error(`Screenshot capture failed: ${message}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
