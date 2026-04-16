import { promises as fs } from "node:fs";
import path from "node:path";

import { linkedinDraftSchema, xDraftSchema } from "@/lib/content";
import type { Locale } from "@/lib/site";

const LOCALES: Locale[] = ["en", "pt"];
const CONTENT_ROOT = path.join(process.cwd(), "content");
const SITE_URL = process.env.SITE_URL ?? "https://michael.business";
const LINKEDIN_SECRET = process.env.LINKEDIN_PUBLISH_SECRET;
const X_SECRET = process.env.X_PUBLISH_SECRET;

type PublishOutcome = {
  channel: "linkedin" | "x";
  locale: Locale;
  slug: string;
  ok: boolean;
  message: string;
};

async function readDrafts<T>(folder: "linkedin" | "x", schema: { parse: (input: unknown) => T }) {
  const dir = path.join(CONTENT_ROOT, folder);
  const entries = await fs.readdir(dir);
  const drafts: Array<{ file: string; draft: T & { slug: string; status: string; generatedAt: string } }> = [];

  for (const entry of entries) {
    if (!entry.endsWith(".json")) continue;
    const file = path.join(dir, entry);
    const raw = await fs.readFile(file, "utf8");
    const draft = schema.parse(JSON.parse(raw)) as T & { slug: string; status: string; generatedAt: string };
    drafts.push({ file, draft });
  }

  return drafts;
}

async function publishChannel(channel: "linkedin" | "x", slug: string, locale: Locale): Promise<PublishOutcome> {
  const secret = channel === "linkedin" ? LINKEDIN_SECRET : X_SECRET;

  if (!secret) {
    return { channel, locale, slug, ok: false, message: `${channel} secret missing` };
  }

  const headerName = channel === "linkedin" ? "x-linkedin-publish-secret" : "x-x-publish-secret";
  const url = `${SITE_URL}/api/${channel}/publish`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [headerName]: secret,
      },
      body: JSON.stringify({ slug, locale }),
    });

    const bodyText = await response.text();

    if (!response.ok) {
      return { channel, locale, slug, ok: false, message: `${response.status} ${bodyText}` };
    }

    return { channel, locale, slug, ok: true, message: bodyText };
  } catch (error) {
    return {
      channel,
      locale,
      slug,
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

async function markPublished(file: string) {
  const raw = await fs.readFile(file, "utf8");
  const payload = JSON.parse(raw);
  payload.status = "published";
  payload.publishedAt = new Date().toISOString();
  await fs.writeFile(file, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function main() {
  const [linkedinDrafts, xDrafts] = await Promise.all([
    readDrafts("linkedin", linkedinDraftSchema),
    readDrafts("x", xDraftSchema),
  ]);

  const unpublishedLinkedin = linkedinDrafts
    .filter(({ draft }) => draft.status !== "published")
    .sort((a, b) => a.draft.generatedAt.localeCompare(b.draft.generatedAt));

  if (unpublishedLinkedin.length === 0) {
    console.log("No unpublished LinkedIn drafts. Queue is empty.");
    return;
  }

  const next = unpublishedLinkedin[0];
  const slug = next.draft.slug;
  const matchingX = xDrafts.find(({ draft }) => draft.slug === slug && draft.status !== "published");

  console.log(`Publishing slug=${slug}`);

  const outcomes: PublishOutcome[] = [];

  for (const locale of LOCALES) {
    outcomes.push(await publishChannel("linkedin", slug, locale));
    if (matchingX) {
      outcomes.push(await publishChannel("x", slug, locale));
    }
  }

  const allLinkedinOk = outcomes.filter((entry) => entry.channel === "linkedin").every((entry) => entry.ok);
  const allXOk = matchingX
    ? outcomes.filter((entry) => entry.channel === "x").every((entry) => entry.ok)
    : true;

  if (allLinkedinOk) {
    await markPublished(next.file);
  }

  if (allXOk && matchingX) {
    await markPublished(matchingX.file);
  }

  for (const outcome of outcomes) {
    const status = outcome.ok ? "OK" : "FAIL";
    console.log(`${status} ${outcome.channel} ${outcome.locale} ${outcome.slug} :: ${outcome.message}`);
  }

  const anyFailure = outcomes.some((entry) => !entry.ok);
  if (anyFailure) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("auto-publish-next-social failed", error);
  process.exit(1);
});
