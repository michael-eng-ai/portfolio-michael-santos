"use client";

import { sendGAEvent } from "@next/third-parties/google";
import { nanoid } from "nanoid";

type EventValue = string | number | boolean | null | undefined;

const ANALYTICS_ENDPOINT = "/api/analytics/collect";
const ANALYTICS_SESSION_KEY = "michael-business-analytics-session";

function getAnalyticsSessionId() {
  if (typeof window === "undefined") {
    return "server";
  }

  try {
    const existing = window.sessionStorage.getItem(ANALYTICS_SESSION_KEY);

    if (existing) {
      return existing;
    }

    const generated = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : nanoid();
    window.sessionStorage.setItem(ANALYTICS_SESSION_KEY, generated);
    return generated;
  } catch {
    return nanoid();
  }
}

function queueInternalEvent(name: string, params: Record<string, EventValue>) {
  if (typeof window === "undefined") {
    return;
  }

  const payload = {
    eventId: typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : nanoid(),
    eventName: name,
    sessionId: getAnalyticsSessionId(),
    occurredAt: new Date().toISOString(),
    params: {
      page: window.location.pathname,
      ...params,
    },
  };
  const body = JSON.stringify(payload);

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon(ANALYTICS_ENDPOINT, blob);
    return;
  }

  void fetch(ANALYTICS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
    keepalive: true,
  }).catch(() => undefined);
}

export function trackEvent(
  name: string,
  params: Record<string, EventValue> = {},
) {
  queueInternalEvent(name, params);

  if (!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
    return;
  }

  sendGAEvent("event", name, params);
}
