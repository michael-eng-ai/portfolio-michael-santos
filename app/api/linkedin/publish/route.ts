import { promises as fs } from "node:fs";
import path from "node:path";

import { NextResponse } from "next/server";
import { z } from "zod";

import { linkedinDraftSchema } from "@/lib/content";
import { publishLinkedinDraft } from "@/lib/linkedin";
import { toErrorMessage } from "@/lib/runtime";
import { isLocale } from "@/lib/site";

const requestSchema = z.object({
  // Constrain to the kebab-case slug shape so the value can never traverse out
  // of content/linkedin/ when joined into a file path below.
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, "slug must be kebab-case"),
  locale: z.string().optional(),
  /** When true, best-effort write status back to the draft JSON (CI/local only). */
  persist: z.boolean().optional(),
});

export async function POST(request: Request) {
  const publishSecret = process.env.LINKEDIN_PUBLISH_SECRET;
  const providedSecret = request.headers.get("x-linkedin-publish-secret");

  if (!publishSecret || providedSecret !== publishSecret) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized.",
      },
      { status: 401 },
    );
  }

  try {
    const { slug, locale, persist } = requestSchema.parse(await request.json());
    const file = path.join(process.cwd(), "content", "linkedin", `${slug}.json`);
    const raw = await fs.readFile(file, "utf8");
    const draft = linkedinDraftSchema.parse(JSON.parse(raw));

    if (draft.status === "published" && draft.publishedUrl) {
      return NextResponse.json({
        success: true,
        result: {
          mode: "already-published",
          published: true,
          id: null,
          publishedUrl: draft.publishedUrl,
          publishedAt: draft.publishedAt ?? null,
          locale: locale && isLocale(locale) ? locale : "en",
          shareMediaCategory: null,
        },
      });
    }

    const result = await publishLinkedinDraft(draft, locale && isLocale(locale) ? locale : "en");

    let persisted = false;
    if (persist && result.published && result.publishedUrl) {
      try {
        const next = {
          ...draft,
          status: "published" as const,
          publishedUrl: result.publishedUrl,
          publishedAt: result.publishedAt ?? new Date().toISOString(),
        };
        await fs.writeFile(file, `${JSON.stringify(next, null, 2)}\n`, "utf8");
        persisted = true;
      } catch (persistError) {
        console.warn(
          `LinkedIn publish succeeded but draft persistence failed for ${slug}: ${toErrorMessage(persistError)}`,
        );
      }
    }

    return NextResponse.json({
      success: true,
      result: {
        ...result,
        persisted,
      },
    });
  } catch (error) {
    // Log the detail server-side; return a generic message so internal paths
    // and driver errors are not exposed to the caller.
    console.error("LinkedIn publish failed:", toErrorMessage(error));
    const isValidationError = error instanceof z.ZodError;
    return NextResponse.json(
      {
        success: false,
        message: isValidationError ? "Invalid request." : "LinkedIn publishing failed.",
      },
      { status: isValidationError ? 400 : 500 },
    );
  }
}
