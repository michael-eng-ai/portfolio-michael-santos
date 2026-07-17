import { promises as fs } from "node:fs";
import path from "node:path";

import { getArticles, linkedinDraftSchema, type LinkedinDraft } from "@/lib/content";
import { publishLinkedinDraft } from "@/lib/linkedin";
import { toErrorMessage } from "@/lib/runtime";
import { isLocale, type Locale } from "@/lib/site";

type CliOptions = {
  slug?: string;
  sourceType?: "article" | "project";
  since?: string;
  max: number;
  locale: Locale;
  delayMs: number;
  dryRun: boolean;
  includeProjects: boolean;
};

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    max: 1,
    locale: "en",
    delayMs: 180_000,
    dryRun: false,
    includeProjects: false,
  };

  const tokens = argv.filter((arg) => arg !== "--");

  for (let index = 0; index < tokens.length; index += 1) {
    const raw = tokens[index];
    const eq = raw.indexOf("=");
    const arg = eq === -1 ? raw : raw.slice(0, eq);
    const inline = eq === -1 ? undefined : raw.slice(eq + 1);
    const next = inline ?? tokens[index + 1];
    const consumedSeparate = inline === undefined && Boolean(tokens[index + 1]);

    if (arg === "--slug" && next) {
      options.slug = next;
      if (consumedSeparate) index += 1;
      continue;
    }
    if (arg === "--since" && next) {
      options.since = next;
      if (consumedSeparate) index += 1;
      continue;
    }
    if (arg === "--max" && next) {
      options.max = Math.max(1, Number.parseInt(next, 10) || 1);
      if (consumedSeparate) index += 1;
      continue;
    }
    if (arg === "--locale" && next && isLocale(next)) {
      options.locale = next;
      if (consumedSeparate) index += 1;
      continue;
    }
    if (arg === "--delay-ms" && next) {
      options.delayMs = Math.max(0, Number.parseInt(next, 10) || 0);
      if (consumedSeparate) index += 1;
      continue;
    }
    if (arg === "--source-type" && (next === "article" || next === "project")) {
      options.sourceType = next;
      if (consumedSeparate) index += 1;
      continue;
    }
    if (arg === "--include-projects") {
      options.includeProjects = true;
      continue;
    }
    if (arg === "--dry-run") {
      options.dryRun = true;
    }
  }

  return options;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function draftPath(slug: string): string {
  return path.join(process.cwd(), "content", "linkedin", `${slug}.json`);
}

async function readDraft(slug: string): Promise<LinkedinDraft> {
  const raw = await fs.readFile(draftPath(slug), "utf8");
  return linkedinDraftSchema.parse(JSON.parse(raw));
}

async function writePublishedDraft(
  draft: LinkedinDraft,
  publishedUrl: string,
  publishedAt: string,
): Promise<void> {
  const next: LinkedinDraft = {
    ...draft,
    status: "published",
    publishedUrl,
    publishedAt,
  };
  await fs.writeFile(draftPath(draft.slug), `${JSON.stringify(next, null, 2)}\n`, "utf8");
}

async function listCandidateSlugs(options: CliOptions): Promise<string[]> {
  if (options.slug) {
    return [options.slug];
  }

  const directory = path.join(process.cwd(), "content", "linkedin");
  const files = (await fs.readdir(directory)).filter((name) => name.endsWith(".json"));
  const articles = await getArticles();
  const articleDateBySlug = new Map(articles.map((article) => [article.slug, article.publishedAt]));

  const drafts: LinkedinDraft[] = [];
  for (const file of files) {
    const draft = linkedinDraftSchema.parse(JSON.parse(await fs.readFile(path.join(directory, file), "utf8")));
    drafts.push(draft);
  }

  const unpublished = drafts.filter((draft) => {
    if (draft.status === "published" || draft.publishedUrl) {
      return false;
    }
    if (options.sourceType && draft.sourceType !== options.sourceType) {
      return false;
    }
    if (draft.sourceType === "project" && !options.includeProjects && !options.sourceType) {
      return false;
    }
    if (options.since && draft.sourceType === "article") {
      const publishedAt = articleDateBySlug.get(draft.sourceSlug);
      if (!publishedAt || publishedAt < options.since) {
        return false;
      }
    }
    return true;
  });

  unpublished.sort((left, right) => {
    const leftDate = articleDateBySlug.get(left.sourceSlug) ?? left.generatedAt;
    const rightDate = articleDateBySlug.get(right.sourceSlug) ?? right.generatedAt;
    return rightDate.localeCompare(leftDate);
  });

  return unpublished.slice(0, options.max).map((draft) => draft.slug);
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  if (!options.slug && !options.since && !options.sourceType) {
    console.error(
      "ERROR: Provide --slug <draft-slug> or --since YYYY-MM-DD (optionally with --max / --include-projects).",
    );
    process.exit(1);
  }

  process.env.LINKEDIN_PUBLISH_ENABLED = process.env.LINKEDIN_PUBLISH_ENABLED ?? "true";

  if (!options.dryRun) {
    const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
    if (!accessToken) {
      console.error("ERROR: LINKEDIN_ACCESS_TOKEN is not set.");
      process.exit(1);
    }
    try {
      const probe = await fetch("https://api.linkedin.com/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (probe.status === 401) {
        console.error(
          "ERROR: LINKEDIN_ACCESS_TOKEN expired (401). Regenerate at https://www.linkedin.com/developers/apps/ and update GitHub Actions + local worker secrets.",
        );
        process.exit(1);
      }
    } catch (error) {
      console.warn(`LinkedIn token probe failed; continuing: ${toErrorMessage(error)}`);
    }
  }

  const slugs = await listCandidateSlugs(options);
  if (slugs.length === 0) {
    console.log("No unpublished LinkedIn drafts matched the selection.");
    return;
  }

  console.log(
    `Publishing ${slugs.length} LinkedIn draft(s) locale=${options.locale} dryRun=${options.dryRun}`,
  );

  let published = 0;

  for (let index = 0; index < slugs.length; index += 1) {
    const slug = slugs[index];
    const draft = await readDraft(slug);

    if (draft.status === "published" || draft.publishedUrl) {
      console.log(`SKIPPED: ${slug} already published (${draft.publishedUrl ?? "no-url"})`);
      continue;
    }

    if (options.dryRun) {
      console.log(`DRY_RUN: would publish ${slug} (${draft.sourceType}/${draft.sourceSlug})`);
      continue;
    }

    try {
      const result = await publishLinkedinDraft(draft, options.locale);
      if (!result.published) {
        console.warn(`SKIPPED: ${slug} -- ${"reason" in result ? result.reason : "not published"}`);
        continue;
      }

      const publishedUrl = result.publishedUrl;
      const publishedAt = result.publishedAt ?? new Date().toISOString();
      if (!publishedUrl) {
        throw new Error("LinkedIn publish succeeded but publishedUrl was empty.");
      }

      await writePublishedDraft(draft, publishedUrl, publishedAt);
      published += 1;
      console.log(`PUBLISHED: ${slug} -> ${publishedUrl} (${result.shareMediaCategory})`);
    } catch (error) {
      console.error(`FAILED: ${slug} -- ${toErrorMessage(error)}`);
      process.exitCode = 1;
      break;
    }

    if (index < slugs.length - 1 && options.delayMs > 0) {
      console.log(`Waiting ${options.delayMs}ms before next publish...`);
      await sleep(options.delayMs);
    }
  }

  console.log(`SUCCESS: ${published}/${slugs.length} LinkedIn drafts published and persisted.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
