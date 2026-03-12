import { promises as fs } from "node:fs";
import path from "node:path";

import { getArticles, getProjects } from "@/lib/content";

function createDraftPayload({
  slug,
  sourceType,
  sourceSlug,
  titleEn,
  titlePt,
  excerptEn,
  excerptPt,
}: {
  slug: string;
  sourceType: "article" | "project";
  sourceSlug: string;
  titleEn: string;
  titlePt: string;
  excerptEn: string;
  excerptPt: string;
}) {
  return {
    slug,
    sourceType,
    sourceSlug,
    status: "draft",
    generatedAt: new Date().toISOString(),
    publishedUrl: null,
    locales: {
      en: {
        hook: titleEn,
        body: excerptEn,
        cta: "See the full story on the site and explore the GitHub implementation."
      },
      pt: {
        hook: titlePt,
        body: excerptPt,
        cta: "Veja a historia completa no site e explore a implementacao no GitHub."
      }
    }
  };
}

async function writeDraft(slug: string, payload: unknown) {
  const targetPath = path.join(process.cwd(), "content", "linkedin", `${slug}.json`);
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Generated ${targetPath}`);
}

async function main() {
  const [articles, projects] = await Promise.all([getArticles(), getProjects()]);

  for (const article of articles) {
    await writeDraft(
      `article-${article.slug}`,
      createDraftPayload({
        slug: `article-${article.slug}`,
        sourceType: "article",
        sourceSlug: article.slug,
        titleEn: article.locales.en.title,
        titlePt: article.locales.pt.title,
        excerptEn: article.locales.en.excerpt,
        excerptPt: article.locales.pt.excerpt,
      }),
    );
  }

  for (const project of projects.filter((entry) => entry.featured)) {
    await writeDraft(
      `project-${project.slug}`,
      createDraftPayload({
        slug: `project-${project.slug}`,
        sourceType: "project",
        sourceSlug: project.slug,
        titleEn: project.locales.en.title,
        titlePt: project.locales.pt.title,
        excerptEn: project.locales.en.summary,
        excerptPt: project.locales.pt.summary,
      }),
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
