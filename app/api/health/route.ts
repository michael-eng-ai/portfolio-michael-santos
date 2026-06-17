import { NextResponse } from "next/server";

import { queryPostgres } from "@/lib/postgres";

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
        total: number;
        active: number;
        enriched: number;
        last_sync: string | null;
      }>(
        `
          select
            count(*)::int as total,
            count(*) filter (where is_active = true)::int as active,
            count(*) filter (where editorial_analysis is not null)::int as enriched,
            max(updated_at)::text as last_sync
          from public.news
        `,
      ),
      queryPostgres<{
        x_last_post: string | null;
        linkedin_last_post: string | null;
        x_dead_letter: number;
        linkedin_dead_letter: number;
      }>(
        `
          select
            max(posted_to_x_at)::text as x_last_post,
            max(posted_to_linkedin_at)::text as linkedin_last_post,
            count(*) filter (where x_post_status = 'dead_letter')::int as x_dead_letter,
            count(*) filter (where linkedin_post_status = 'dead_letter')::int as linkedin_dead_letter
          from public.news
          where is_active = true
        `,
      ),
    ]);

    databaseOk = true;

    const news = newsResult.rows[0];
    newsCheck = {
      total: news?.total ?? 0,
      active: news?.active ?? 0,
      enriched: news?.enriched ?? 0,
      lastSync: news?.last_sync ?? null,
    };

    const social = socialResult.rows[0];
    socialCheck = {
      x: {
        lastPost: social?.x_last_post ?? null,
        deadLetter: social?.x_dead_letter ?? 0,
      },
      linkedin: {
        lastPost: social?.linkedin_last_post ?? null,
        deadLetter: social?.linkedin_dead_letter ?? 0,
      },
    };
  } catch (error) {
    databaseError =
      error instanceof Error ? error.message : "Unknown database error";
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
