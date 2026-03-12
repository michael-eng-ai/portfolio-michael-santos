"use client";

import { sendGAEvent } from "@next/third-parties/google";

type EventValue = string | number | boolean | undefined;

export function trackEvent(
  name: string,
  params: Record<string, EventValue> = {},
) {
  if (!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
    return;
  }

  sendGAEvent("event", name, params);
}
