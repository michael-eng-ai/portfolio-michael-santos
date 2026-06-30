import { toErrorMessage } from "@/lib/runtime";

// Lightweight fixed-window rate limiter backed by Upstash Redis / Vercel KV via
// their REST API. No SDK dependency: a single pipelined INCR + PEXPIRE NX call
// per request. Designed for Vercel's stateless serverless runtime, where an
// in-memory limiter would not share state across instances.
//
// Configuration (either name works — Vercel KV exposes Upstash-compatible vars):
//   UPSTASH_REDIS_REST_URL  / KV_REST_API_URL
//   UPSTASH_REDIS_REST_TOKEN / KV_REST_API_TOKEN
//
// When unconfigured the limiter is a no-op (allows everything), so the app runs
// unchanged in local/dev or before the store is provisioned. It also fails open
// on any limiter error, so a Redis outage never takes down the endpoint.

export type RateLimitResult = {
  ok: boolean;
  limit: number;
  remaining: number;
};

type RedisConfig = {
  url: string;
  token: string;
};

function getRedisConfig(): RedisConfig | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    return null;
  }

  return { url, token };
}

function allow(limit: number): RateLimitResult {
  return { ok: true, limit, remaining: limit };
}

/**
 * Increment the counter for `identifier` within a fixed window and report
 * whether the caller is still under `limit`. Allows (fails open) when the store
 * is not configured or unreachable.
 */
export async function checkRateLimit(
  identifier: string,
  options: { limit: number; windowSeconds: number },
): Promise<RateLimitResult> {
  const config = getRedisConfig();

  if (!config) {
    return allow(options.limit);
  }

  const key = `ratelimit:${identifier}`;
  const windowMs = options.windowSeconds * 1000;

  try {
    const response = await fetch(`${config.url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", key],
        ["PEXPIRE", key, windowMs, "NX"],
      ]),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(`[rate-limit] store responded ${response.status}; allowing request`);
      return allow(options.limit);
    }

    const payload = (await response.json()) as Array<{ result?: number; error?: string }>;
    const count = typeof payload?.[0]?.result === "number" ? payload[0].result : 0;
    const remaining = Math.max(0, options.limit - count);

    return { ok: count <= options.limit, limit: options.limit, remaining };
  } catch (error) {
    console.error(`[rate-limit] check failed; allowing request: ${toErrorMessage(error)}`);
    return allow(options.limit);
  }
}

/** Best-effort client IP from the standard proxy headers (Vercel sets these). */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}
