import { promises as fs } from "node:fs";
import path from "node:path";

import { NextResponse } from "next/server";
import { z } from "zod";

import { linkedinDraftSchema } from "@/lib/content";
import { publishLinkedinDraft } from "@/lib/linkedin";

const requestSchema = z.object({
  slug: z.string().min(1),
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
    const { slug } = requestSchema.parse(await request.json());
    const file = path.join(process.cwd(), "content", "linkedin", `${slug}.json`);
    const raw = await fs.readFile(file, "utf8");
    const draft = linkedinDraftSchema.parse(JSON.parse(raw));
    const result = await publishLinkedinDraft(draft);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "LinkedIn publishing failed.",
      },
      { status: 400 },
    );
  }
}
