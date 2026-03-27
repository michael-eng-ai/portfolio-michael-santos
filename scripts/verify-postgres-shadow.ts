import { createClient } from "@supabase/supabase-js";

import { closePostgresPool, queryPostgres } from "@/lib/postgres";

type ComparableNewsRow = {
  slug: string;
  source_url: string;
  published_at: string;
  is_active: boolean;
};

type ComparableSubscriberRow = {
  email: string;
  locale: string;
};

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function fetchAllSupabaseRows<T extends Record<string, unknown>>(
  table: "news" | "newsletter_subscribers",
  columns: string,
  orderColumn: string,
  options?: { optional?: boolean },
) {
  const supabase = getSupabaseAdminClient();
  const pageSize = 1_000;
  const rows: T[] = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .order(orderColumn, { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      if (options?.optional && error.message.includes("schema cache")) {
        console.warn(`Skipping optional Supabase table ${table}: ${error.message}`);
        return null;
      }

      throw new Error(`Failed to fetch ${table} from Supabase: ${error.message}`);
    }

    const chunk = ((data ?? []) as unknown) as T[];
    rows.push(...chunk);

    if (chunk.length < pageSize) {
      break;
    }
  }

  return rows;
}

function diffValues(left: string[], right: string[]) {
  const rightSet = new Set(right);
  const leftSet = new Set(left);

  return {
    missingInPostgres: left.filter((value) => !rightSet.has(value)),
    extraInPostgres: right.filter((value) => !leftSet.has(value)),
  };
}

async function main() {
  try {
    const [supabaseNews, supabaseSubscribers, postgresNews, postgresSubscribers] = await Promise.all([
      fetchAllSupabaseRows<ComparableNewsRow>("news", "slug, source_url, published_at, is_active", "id"),
      fetchAllSupabaseRows<ComparableSubscriberRow>("newsletter_subscribers", "email, locale", "id", {
        optional: true,
      }),
      queryPostgres<ComparableNewsRow>(
        "select slug, source_url, published_at::text as published_at, is_active from public.news order by id asc",
      ),
      queryPostgres<ComparableSubscriberRow>(
        "select email, locale from public.newsletter_subscribers order by id asc",
      ),
    ]);

    if (!supabaseNews) {
      throw new Error("Supabase news table is required for shadow verification.");
    }

    const newsDiff = diffValues(
      supabaseNews.map((row: ComparableNewsRow) => `${row.source_url}|${row.slug}`),
      postgresNews.rows.map((row: ComparableNewsRow) => `${row.source_url}|${row.slug}`),
    );

    const subscriberDiff = supabaseSubscribers
      ? diffValues(
          supabaseSubscribers.map((row: ComparableSubscriberRow) => `${row.email}|${row.locale}`),
          postgresSubscribers.rows.map((row: ComparableSubscriberRow) => `${row.email}|${row.locale}`),
        )
      : { missingInPostgres: [], extraInPostgres: [] };

    const newsCountsMatch =
      supabaseNews.length === postgresNews.rows.length &&
      newsDiff.missingInPostgres.length === 0 &&
      newsDiff.extraInPostgres.length === 0;
    const subscriberCountsMatch =
      supabaseSubscribers == null ||
      (supabaseSubscribers.length === postgresSubscribers.rows.length &&
        subscriberDiff.missingInPostgres.length === 0 &&
        subscriberDiff.extraInPostgres.length === 0);

    console.log("Shadow verification summary");
    console.log(`- news: supabase=${supabaseNews.length}, postgres=${postgresNews.rows.length}`);
    console.log(
      `- subscribers: supabase=${supabaseSubscribers?.length ?? "not configured"}, postgres=${postgresSubscribers.rows.length}`,
    );

    if (!newsCountsMatch) {
      console.error("News mismatch detected");
      console.error(`- missing in postgres: ${newsDiff.missingInPostgres.slice(0, 10).join(", ") || "none"}`);
      console.error(`- extra in postgres: ${newsDiff.extraInPostgres.slice(0, 10).join(", ") || "none"}`);
    }

    if (!subscriberCountsMatch) {
      console.error("Newsletter subscriber mismatch detected");
      console.error(
        `- missing in postgres: ${subscriberDiff.missingInPostgres.slice(0, 10).join(", ") || "none"}`,
      );
      console.error(
        `- extra in postgres: ${subscriberDiff.extraInPostgres.slice(0, 10).join(", ") || "none"}`,
      );
    }

    if (!newsCountsMatch || !subscriberCountsMatch) {
      throw new Error("Shadow verification failed");
    }

    console.log("Shadow verification passed");
  } finally {
    await closePostgresPool();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
