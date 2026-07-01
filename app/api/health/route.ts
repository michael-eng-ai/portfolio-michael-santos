import { NextResponse } from "next/server";

import { queryPostgres } from "@/lib/postgres";
import { toErrorMessage } from "@/lib/runtime";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type HealthCheck = {
  status: "ok" | "degraded";
  timestamp: string;
  checks: {
    database: { ok: boolean; provider: string; error?: string };
    news: {
      total: number;
      active: number;
      enriched: number;
      lastSync: string | null;
    } | null;
    social: {
      x: { lastPost: string | null; deadLetter: number } | null;
      linkedin: { lastPost: string | null; deadLetter: number } | null;
    } | null;
  };
};

function toCount(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function toTimestamp(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  return null;
}

export async function GET() {
  const provider = "postgres";
  const timestamp = new Date().toISOString();

  let databaseOk = false;
  let newsCheck: HealthCheck["checks"]["news"] = null;
  let socialCheck: HealthCheck["checks"]["social"] = null;
  let databaseError: string | undefined;

  try {
    const [newsResult, socialResult] = await Promise.all([
      queryPostgres<{
        total: string | number;
        active: string | number;
        enriched: string | number;
        last_sync: string | null;
      }>(
        `
          select
            count(*) as total,
            count(*) filter (where is_active = true) as active,
            count(*) filter (where editorial_analysis is not null) as enriched,
            max(updated_at) as last_sync
          from public.news
        `,
      ),
      queryPostgres<{
        last_x_post: string | null;
        last_linkedin_post: string | null;
        x_dead_letter: string | number;
        linkedin_dead_letter: string | number;
      }>(
        `
          select
            max(posted_to_x_at) as last_x_post,
            max(posted_to_linkedin_at) as last_linkedin_post,
            count(*) filter (where x_post_status = 'dead_letter') as x_dead_letter,
            count(*) filter (where linkedin_post_status = 'dead_letter') as linkedin_dead_letter
          from public.news
          where is_active = true
        `,
      ),
    ]);

    databaseOk = true;

    const newsRow = newsResult.rows[0];
    newsCheck = {
      total: toCount(newsRow?.total),
      active: toCount(newsRow?.active),
      enriched: toCount(newsRow?.enriched),
      lastSync: toTimestamp(newsRow?.last_sync),
    };

    const socialRow = socialResult.rows[0];
    socialCheck = {
      x: {
        lastPost: toTimestamp(socialRow?.last_x_post),
        deadLetter: toCount(socialRow?.x_dead_letter),
      },
      linkedin: {
        lastPost: toTimestamp(socialRow?.last_linkedin_post),
        deadLetter: toCount(socialRow?.linkedin_dead_letter),
      },
    };
  } catch (error) {
    // Log the real reason server-side; expose only a generic category to the
    // unauthenticated caller so driver/connection details are not leaked.
    console.error("Health database check failed:", toErrorMessage(error));
    databaseError = "Database unavailable";
  }

  const health: HealthCheck = {
    status: databaseOk ? "ok" : "degraded",
    timestamp,
    checks: {
      database: {
        ok: databaseOk,
        provider,
        ...(databaseError ? { error: databaseError } : {}),
      },
      news: newsCheck,
      social: socialCheck,
    },
  };

  return NextResponse.json(health, {
    status: databaseOk ? 200 : 503,
  });
}
