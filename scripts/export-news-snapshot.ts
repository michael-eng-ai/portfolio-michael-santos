import { createClient } from "@supabase/supabase-js";

import { newsSchema } from "@/lib/content";
import { writeNewsSnapshot } from "@/lib/news-utils";

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("news")
    .select("*")
    .eq("is_active", true)
    .order("published_at", { ascending: false });

  if (error) {
    console.error("ERROR: failed to export news snapshot", error.message);
    process.exit(1);
  }

  const snapshotItems = (data ?? []).map((row) =>
    newsSchema.parse({
      slug: row.slug,
      publishedAt: row.published_at,
      sourceName: row.source_name,
      sourceUrl: row.source_url,
      imageUrl: row.image_url,
      category: row.category,
      tags: row.tags,
      relatedProjectSlugs: row.related_project_slugs,
      editorialAnalysis: row.editorial_analysis ?? null,
      locales: row.locales,
    }),
  );

  await writeNewsSnapshot(snapshotItems);
  console.log(`SUCCESS: wrote fallback snapshot with ${snapshotItems.length} active news items`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
