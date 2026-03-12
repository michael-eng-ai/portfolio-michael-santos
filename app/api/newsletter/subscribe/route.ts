import { NextResponse } from "next/server";
import { z } from "zod";

import { subscribeToNewsletter } from "@/lib/newsletter";

const requestSchema = z.object({
  email: z.string().email(),
  locale: z.enum(["en", "pt"]),
  source: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const payload = requestSchema.parse(await request.json());
    await subscribeToNewsletter(payload);

    return NextResponse.json({
      success: true,
      message: payload.locale === "pt" ? "Inscricao concluida." : "Subscription completed.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Newsletter subscription failed.",
      },
      { status: 400 },
    );
  }
}
