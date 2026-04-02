import { NextResponse } from "next/server";
import { z } from "zod";

import { insertAnalyticsEvents } from "@/lib/database";

const primitiveSchema = z.union([z.string().max(500), z.number(), z.boolean(), z.null()]);

const eventSchema = z.object({
  eventId: z.string().min(1).max(120),
  eventName: z.string().min(1).max(120),
  sessionId: z.string().min(1).max(120),
  occurredAt: z.string().datetime(),
  params: z.record(z.string().max(80), primitiveSchema).default({}),
});

const requestSchema = z.union([
  eventSchema,
  z.array(eventSchema).min(1).max(20),
]);

function toNullableString(value: string | number | boolean | null | undefined) {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function toNullableInteger(value: string | number | boolean | null | undefined) {
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

export async function POST(request: Request) {
  try {
    const rawPayload = await request.json();
    const parsed = requestSchema.parse(rawPayload);
    const events = Array.isArray(parsed) ? parsed : [parsed];

    await insertAnalyticsEvents(
      events.map((event) => ({
        event_id: event.eventId,
        event_name: event.eventName,
        session_id: event.sessionId,
        occurred_at: event.occurredAt,
        page: toNullableString(event.params.page),
        locale: toNullableString(event.params.locale),
        page_type: toNullableString(event.params.page_type),
        source_type: toNullableString(event.params.source_type),
        source_slug: toNullableString(event.params.source_slug),
        target_type: toNullableString(event.params.target_type),
        target_slug: toNullableString(event.params.target_slug),
        location: toNullableString(event.params.location),
        depth: toNullableInteger(event.params.depth),
        metadata: event.params,
      })),
    );

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Analytics collect failed", error);

    return NextResponse.json(
      {
        success: false,
      },
      { status: error instanceof z.ZodError ? 400 : 202 },
    );
  }
}
