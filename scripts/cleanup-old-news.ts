import {
  getDatabaseProvider,
  getRequiredWriteDatabaseEnvKeys,
  updateNewsRowBySlug,
} from "@/lib/database";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { queryPostgres } from "@/lib/postgres";
import { toErrorMessage, withRetry } from "@/lib/runtime";

const KEEP_ACTIVE_COUNT = 10;

type ActiveNewsSlug = {
  slug: string;
};

async function fetchActiveNewsSlugsFromSupabase(): Promise<ActiveNewsSlug[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("news")
    .select("slug")
    .eq("is_active", true)
    .order("published_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row: Record<string, unknown>) => ({
    slug: row.slug as string,
  }));
}

async function fetchActiveNewsSlugsFromPostgres(): Promise<ActiveNewsSlug[]> {
  const { rows } = await queryPostgres<ActiveNewsSlug>(
    "select slug from public.news where is_active = true order by published_at desc",
  );

  return rows;
}

async function fetchActiveNewsSlugs(): Promise<ActiveNewsSlug[]> {
  return getDatabaseProvider() === "postgres"
    ? fetchActiveNewsSlugsFromPostgres()
    : fetchActiveNewsSlugsFromSupabase();
}

async function main(): Promise<void> {
  const missingDatabaseEnv = getRequiredWriteDatabaseEnvKeys().filter((key) => !process.env[key]);

  if (missingDatabaseEnv.length > 0) {
    console.error(`ERROR: Missing required database env vars: ${missingDatabaseEnv.join(", ")}`);
    process.exit(1);
  }

  const allActiveSlugs = await fetchActiveNewsSlugs();

  if (allActiveSlugs.length <= KEEP_ACTIVE_COUNT) {
    console.log(`Only ${allActiveSlugs.length} active items. No cleanup needed.`);
    return;
  }

  const toDeactivate = allActiveSlugs.slice(KEEP_ACTIVE_COUNT);

  console.log(`Found ${allActiveSlugs.length} active items. Deactivating ${toDeactivate.length} oldest.`);

  let deactivated = 0;
  for (const item of toDeactivate) {
    try {
      await withRetry(
        () => updateNewsRowBySlug(item.slug, { is_active: false }),
        {
          attempts: 3,
          delayMs: 500,
          shouldRetry: (error) => toErrorMessage(error).length > 0,
        },
      );
      deactivated += 1;
    } catch (updateError: unknown) {
      console.warn(`SKIPPED deactivation: ${item.slug} -- ${toErrorMessage(updateError)}`);
    }
  }

  console.log(`CLEANUP: deactivated ${deactivated} items, keeping ${KEEP_ACTIVE_COUNT} most recent`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
