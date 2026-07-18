import { promises as fs } from "node:fs";
import path from "node:path";

import {
  getArticles,
  getProjects,
  linkedinDraftSchema,
  newsSchema,
  xDraftSchema,
  type NewsReference,
} from "@/lib/content";
import {
  buildSignalLocaleCopy,
  buildSignalXPosts,
  inferSignalStake,
  type SignalStake,
} from "@/lib/signal-draft-copy";
import { localePath, siteConfig } from "@/lib/site";
import { withSocialUtm } from "@/lib/utm";

type CandidateKind = "news" | "project" | "article";

type SignalCandidate = {
  kind: CandidateKind;
  sourceSlug: string;
  subject: string;
  nicheAngleEn: string;
  nicheAnglePt: string;
  stake: SignalStake;
  proofUrl: string | null;
  sitePathEn: string | null;
  sitePathPt: string | null;
  tags: string[];
};

const NICHE_PATTERN =
  /\b(data|ai|ml|llm|rag|dbt|kafka|spark|airflow|lakehouse|snowflake|databricks|postgres|pgvector|etl|pipeline|mcp|agentic|streaming|cdc|observability|governance|iceberg|delta|warehouse|analytics)\b/i;

function fitsDeAiNiche(candidate: Pick<SignalCandidate, "tags" | "subject" | "nicheAngleEn" | "sourceSlug">): boolean {
  const haystack = `${candidate.tags.join(" ")} ${candidate.subject} ${candidate.nicheAngleEn} ${candidate.sourceSlug}`;
  return NICHE_PATTERN.test(haystack);
}

type CliOptions = {
  max: number;
  dryRun: boolean;
};

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { max: 3, dryRun: false };
  const tokens = argv.filter((arg) => arg !== "--");

  for (let index = 0; index < tokens.length; index += 1) {
    const raw = tokens[index];
    const eq = raw.indexOf("=");
    const arg = eq === -1 ? raw : raw.slice(0, eq);
    const inline = eq === -1 ? undefined : raw.slice(eq + 1);
    const next = inline ?? tokens[index + 1];
    const consumedSeparate = inline === undefined && Boolean(tokens[index + 1]);

    if (arg === "--max" && next) {
      options.max = Math.max(1, Number.parseInt(next, 10) || 3);
      if (consumedSeparate) index += 1;
      continue;
    }
    if (arg === "--dry-run") {
      options.dryRun = true;
    }
  }

  return options;
}

function todayPrefix(): string {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function shortSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

async function readManualNews(): Promise<NewsReference[]> {
  const directory = path.join(process.cwd(), "content", "news");
  try {
    const files = (await fs.readdir(directory)).filter((name) => name.endsWith(".json"));
    const entries = await Promise.all(
      files.map(async (file) => {
        const raw = await fs.readFile(path.join(directory, file), "utf8");
        return newsSchema.parse(JSON.parse(raw));
      }),
    );
    return entries.sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
  } catch {
    return [];
  }
}

async function collectCandidates(): Promise<SignalCandidate[]> {
  const [news, projects, articles] = await Promise.all([
    readManualNews(),
    getProjects(),
    getArticles(),
  ]);

  const candidates: SignalCandidate[] = [];

  for (const item of news.slice(0, 8)) {
    candidates.push({
      kind: "news",
      sourceSlug: item.slug,
      subject: item.sourceName,
      nicheAngleEn: item.locales.en.whyItMatters,
      nicheAnglePt: item.locales.pt.whyItMatters,
      stake: inferSignalStake(item.tags, `${item.locales.en.title} ${item.locales.en.summary}`),
      proofUrl: item.sourceUrl,
      sitePathEn: `/news/${item.slug}`,
      sitePathPt: `/news/${item.slug}`,
      tags: item.tags,
    });
  }

  for (const project of projects.filter((entry) => entry.featured).slice(0, 6)) {
    candidates.push({
      kind: "project",
      sourceSlug: project.slug,
      subject: project.locales.en.title,
      nicheAngleEn: project.locales.en.summary,
      nicheAnglePt: project.locales.pt.summary,
      stake: inferSignalStake(project.tags, project.locales.en.businessProblem),
      proofUrl: project.github.url,
      sitePathEn: `/projects/${project.slug}`,
      sitePathPt: `/projects/${project.slug}`,
      tags: project.tags,
    });
  }

  for (const article of articles.slice(0, 6)) {
    const relatedProof =
      projects.find((project) => article.relatedProjectSlugs.includes(project.slug))?.github.url ??
      null;
    candidates.push({
      kind: "article",
      sourceSlug: article.slug,
      subject: article.locales.en.title.split(":")[0]?.trim() || article.locales.en.title,
      nicheAngleEn: article.locales.en.excerpt,
      nicheAnglePt: article.locales.pt.excerpt,
      stake: inferSignalStake(article.tags, article.locales.en.excerpt),
      proofUrl: relatedProof,
      sitePathEn: `/articles/${article.slug}`,
      sitePathPt: `/articles/${article.slug}`,
      tags: article.tags,
    });
  }

  return candidates.filter(fitsDeAiNiche);
}

function pickDiverse(candidates: SignalCandidate[], max: number): SignalCandidate[] {
  const picked: SignalCandidate[] = [];
  const usedSlugs = new Set<string>();

  // Prefer one of each kind first, then fill.
  for (const kind of ["news", "project", "article"] as CandidateKind[]) {
    const next = candidates.find((entry) => entry.kind === kind && !usedSlugs.has(entry.sourceSlug));
    if (next) {
      picked.push(next);
      usedSlugs.add(next.sourceSlug);
    }
    if (picked.length >= max) {
      return picked;
    }
  }

  for (const entry of candidates) {
    if (usedSlugs.has(entry.sourceSlug)) {
      continue;
    }
    picked.push(entry);
    usedSlugs.add(entry.sourceSlug);
    if (picked.length >= max) {
      break;
    }
  }

  return picked;
}

type ExistingDraft = {
  status?: string;
  publishedUrl?: string | null;
};

async function readExisting(targetPath: string): Promise<ExistingDraft | null> {
  try {
    return JSON.parse(await fs.readFile(targetPath, "utf8")) as ExistingDraft;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

function shouldPreserve(existing: ExistingDraft | null): boolean {
  if (!existing) {
    return false;
  }
  if (existing.publishedUrl) {
    return true;
  }
  const status = existing.status?.toLowerCase();
  return Boolean(status && status !== "draft");
}

async function writeJson(targetPath: string, payload: unknown, dryRun: boolean) {
  const existing = await readExisting(targetPath);
  if (shouldPreserve(existing)) {
    console.log(`Skipped human/published draft ${targetPath}`);
    return false;
  }

  if (dryRun) {
    console.log(`DRY_RUN: would write ${targetPath}`);
    return true;
  }

  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Generated ${targetPath}`);
  return true;
}

function buildMediaPath(candidate: SignalCandidate): string {
  return `/images/social/${todayPrefix()}-${shortSlug(candidate.sourceSlug)}.png`;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const candidates = pickDiverse(await collectCandidates(), options.max);

  if (candidates.length === 0) {
    console.log("No signal candidates found from news/projects/articles.");
    return;
  }

  console.log(
    `Creating ${candidates.length} signal draft(s) (draft-only, mediaSource=screenshot). dryRun=${options.dryRun}`,
  );

  for (const candidate of candidates) {
    const signalKey = shortSlug(candidate.sourceSlug);
    const draftSlug = `signal-${signalKey}`;
    const mediaPath = buildMediaPath(candidate);
    const hasProof = Boolean(candidate.proofUrl);
    const hasSiteUrl = Boolean(candidate.sitePathEn);

    const baseEn = candidate.sitePathEn
      ? `${siteConfig.url}${localePath("en", candidate.sitePathEn)}`
      : `${siteConfig.url}${localePath("en", "/")}`;
    const basePt = candidate.sitePathPt
      ? `${siteConfig.url}${localePath("pt", candidate.sitePathPt)}`
      : `${siteConfig.url}${localePath("pt", "/")}`;

    const linkedinEn = withSocialUtm(baseEn, {
      source: "linkedin",
      campaign: draftSlug,
      content: "signal",
    });
    const linkedinPt = withSocialUtm(basePt, {
      source: "linkedin",
      campaign: draftSlug,
      content: "signal",
    });
    const xEn = withSocialUtm(baseEn, {
      source: "x",
      campaign: draftSlug,
      content: "signal",
    });
    const xPt = withSocialUtm(basePt, {
      source: "x",
      campaign: draftSlug,
      content: "signal",
    });

    const enCopy = buildSignalLocaleCopy({
      locale: "en",
      subject: candidate.subject,
      stake: candidate.stake,
      nicheAngle: candidate.nicheAngleEn,
      hasProof,
      hasSiteUrl,
    });
    const ptCopy = buildSignalLocaleCopy({
      locale: "pt",
      subject: candidate.subject,
      stake: candidate.stake,
      nicheAngle: candidate.nicheAnglePt,
      hasProof,
      hasSiteUrl,
    });

    const linkedinPayload = linkedinDraftSchema.parse({
      slug: draftSlug,
      sourceType: "signal",
      sourceSlug: candidate.sourceSlug,
      status: "draft",
      generatedAt: new Date().toISOString(),
      publishedUrl: null,
      mediaPath,
      mediaSource: "screenshot",
      urls: {
        en: linkedinEn,
        pt: linkedinPt,
        proof: candidate.proofUrl,
      },
      locales: {
        en: enCopy,
        pt: ptCopy,
      },
    });

    const xPayload = xDraftSchema.parse({
      slug: draftSlug,
      sourceType: "signal",
      sourceSlug: candidate.sourceSlug,
      status: "draft",
      generatedAt: new Date().toISOString(),
      publishedUrl: null,
      mediaPath,
      mediaSource: "screenshot",
      urls: {
        en: xEn,
        pt: xPt,
        proof: candidate.proofUrl,
      },
      locales: {
        en: {
          posts: buildSignalXPosts({
            locale: "en",
            subject: candidate.subject,
            stake: candidate.stake,
            nicheAngle: candidate.nicheAngleEn,
            hasProof,
            proofUrl: candidate.proofUrl,
          }),
        },
        pt: {
          posts: buildSignalXPosts({
            locale: "pt",
            subject: candidate.subject,
            stake: candidate.stake,
            nicheAngle: candidate.nicheAnglePt,
            hasProof,
            proofUrl: candidate.proofUrl,
          }),
        },
      },
    });

    const linkedinPath = path.join(process.cwd(), "content", "linkedin", `${draftSlug}.json`);
    const xPath = path.join(process.cwd(), "content", "x", `${draftSlug}.json`);

    await writeJson(linkedinPath, linkedinPayload, options.dryRun);
    await writeJson(xPath, xPayload, options.dryRun);

    console.log(
      `  - ${draftSlug} [${candidate.kind}/${candidate.stake}] mediaPath=${mediaPath} (capture screenshot before approve)`,
    );
  }

  console.log(
    "Done. Review hooks, capture screenshots into public/images/social/, set status=approved, then publish.",
  );
  console.log("This script never publishes to LinkedIn/X APIs.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
