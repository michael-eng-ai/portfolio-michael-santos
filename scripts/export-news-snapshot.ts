import { listActiveNewsRows } from "@/lib/database";
import { newsSchema } from "@/lib/content";
import { writeNewsSnapshot } from "@/lib/news-utils";

async function main() {
  const snapshotItems = (await listActiveNewsRows()).map((row) =>
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
