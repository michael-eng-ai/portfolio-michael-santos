// Standalone readiness check for the VM PostgreSQL target.
//
// This script touches the PostgreSQL database configured via DATABASE_URL.
// Run it to confirm the VM is reachable and serving active news.
//
//   DATABASE_URL=postgres://... [DATABASE_SSL=require] pnpm db:cutover:check

import { closePostgresPool, queryPostgres } from "@/lib/postgres";

type NewsSummaryRow = {
  active_count: number;
  total_count: number;
  latest_published_at: string | null;
};

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Point it at the VM PostgreSQL before running this check.");
  }

  try {
    const { rows } = await queryPostgres<NewsSummaryRow>(
      `
        select
          count(*) filter (where is_active = true)::int as active_count,
          count(*)::int as total_count,
          max(published_at) filter (where is_active = true)::text as latest_published_at
        from public.news
      `,
    );

    const summary = rows[0] ?? { active_count: 0, total_count: 0, latest_published_at: null };

    console.log("PostgreSQL readiness check");
    console.log(`- connection: ok`);
    console.log(`- news rows: total=${summary.total_count}, active=${summary.active_count}`);
    console.log(`- latest active published_at: ${summary.latest_published_at ?? "none"}`);

    if (summary.active_count === 0) {
      throw new Error(
        "PostgreSQL is reachable but has no active news rows. Run `pnpm db:shadow:sync` before cutover.",
      );
    }

    console.log("PostgreSQL is ready for cutover.");
  } finally {
    await closePostgresPool();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
