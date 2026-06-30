import { NextResponse } from "next/server";
import { z } from "zod";

import { subscribeToNewsletter } from "@/lib/newsletter";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { toErrorMessage } from "@/lib/runtime";

const requestSchema = z.object({
  email: z.string().email(),
  locale: z.enum(["en", "pt"]),
  source: z.string().min(1),
  website: z.string().optional().default(""),
});

export async function POST(request: Request) {
  let locale: "en" | "pt" = "en";

  const rate = await checkRateLimit(`newsletter:${getClientIp(request)}`, {
    limit: 5,
    windowSeconds: 60,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { success: false, message: "Too many requests. Please try again shortly." },
      { status: 429 },
    );
  }

  try {
    const rawPayload = await request.json();
    if (rawPayload && typeof rawPayload === "object" && "locale" in rawPayload && rawPayload.locale === "pt") {
      locale = "pt";
    }

    const payload = requestSchema.parse(rawPayload);

    // Hidden field used to silently discard obvious bot submissions.
    if (payload.website.trim().length > 0) {
      return NextResponse.json({
        success: true,
        message: locale === "pt" ? "Inscricao concluida." : "Subscription completed.",
      });
    }

    await subscribeToNewsletter(payload);

    return NextResponse.json({
      success: true,
      message: payload.locale === "pt" ? "Inscricao concluida." : "Subscription completed.",
    });
  } catch (error) {
    console.error("Newsletter subscription failed:", toErrorMessage(error));

    return NextResponse.json(
      {
        success: false,
        message:
          locale === "pt"
            ? "Nao foi possivel concluir a inscricao agora. Tente novamente em instantes."
            : "We could not complete your subscription right now. Please try again in a moment.",
      },
      { status: error instanceof z.ZodError ? 400 : 500 },
    );
  }
}
