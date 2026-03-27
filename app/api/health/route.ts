import { NextResponse } from "next/server";

import { getDatabaseProvider } from "@/lib/database";
import { getSupabaseAdminClient } from "@/lib/supabase";

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
  const provider = getDatabaseProvider();
  const timestamp = new Date().toISOString();

  let databaseOk = false;
  let newsCheck: HealthCheck["checks"]["news"] = null;
  let socialCheck: HealthCheck["checks"]["social"] = null;
  let databaseError: string | undefined;

  try {
    const supabase = getSupabaseAdminClient();

    const [newsResult, socialResult] = await Promise.all([
      supabase
        .from("news")
        .select("is_active, editorial_analysis, updated_at", { count: "exact" }),
      supabase
        .from("news")
        .select(
          "posted_to_x_at, posted_to_linkedin_at, x_post_status, linkedin_post_status, updated_at",
        )
        .eq("is_active", true),
    ]);

    if (newsResult.error) {
      throw new Error(newsResult.error.message);
    }

    databaseOk = true;

    const newsRows = newsResult.data ?? [];
    const totalCount = newsResult.count ?? newsRows.length;
    const activeCount = newsRows.filter(
      (row) => row.is_active === true,
    ).length;
    const enrichedCount = newsRows.filter(
      (row) => row.editorial_analysis !== null,
    ).length;

    const timestamps = newsRows
      .map((row) => row.updated_at as string | null)
      .filter(Boolean)
      .sort()
      .reverse();

    newsCheck = {
      total: totalCount,
      active: activeCount,
      enriched: enrichedCount,
      lastSync: timestamps[0] ?? null,
    };

    if (!socialResult.error) {
      const socialRows = socialResult.data ?? [];

      const xPosts = socialRows
        .map((row) => row.posted_to_x_at as string | null)
        .filter(Boolean)
        .sort()
        .reverse();

      const linkedinPosts = socialRows
        .map((row) => row.posted_to_linkedin_at as string | null)
        .filter(Boolean)
        .sort()
        .reverse();

      const xDeadLetterCount = socialRows.filter(
        (row) => row.x_post_status === "dead_letter",
      ).length;

      const linkedinDeadLetterCount = socialRows.filter(
        (row) => row.linkedin_post_status === "dead_letter",
      ).length;

      socialCheck = {
        x: {
          lastPost: xPosts[0] ?? null,
          deadLetter: xDeadLetterCount,
        },
        linkedin: {
          lastPost: linkedinPosts[0] ?? null,
          deadLetter: linkedinDeadLetterCount,
        },
      };
    }
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
