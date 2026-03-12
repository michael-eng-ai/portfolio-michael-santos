import { promises as fs } from "node:fs";
import path from "node:path";

import { NextResponse } from "next/server";
import { z } from "zod";

import { xDraftSchema } from "@/lib/content";
import { isLocale } from "@/lib/site";
import { publishXDraft } from "@/lib/x";

const requestSchema = z.object({
  slug: z.string().min(1),
  locale: z.string().optional(),
});

export async function POST(request: Request) {
  const publishSecret = process.env.X_PUBLISH_SECRET;
  const providedSecret = request.headers.get("x-x-publish-secret");

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
    const { slug, locale } = requestSchema.parse(await request.json());
    const file = path.join(process.cwd(), "content", "x", `${slug}.json`);
    const raw = await fs.readFile(file, "utf8");
    const draft = xDraftSchema.parse(JSON.parse(raw));
    const result = await publishXDraft(draft, locale && isLocale(locale) ? locale : "en");

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "X publishing failed.",
      },
      { status: 400 },
    );
  }
}
