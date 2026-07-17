import { promises as fs } from "node:fs";
import path from "node:path";

import { getArticles, getProjects } from "@/lib/content";
import { localePath, siteConfig } from "@/lib/site";
import { withSocialUtm } from "@/lib/utm";

function createDraftPayload({
  slug,
  sourceType,
  sourceSlug,
  titleEn,
  titlePt,
  excerptEn,
  excerptPt,
  urls,
}: {
  slug: string;
  sourceType: "article" | "project";
  sourceSlug: string;
  titleEn: string;
  titlePt: string;
  excerptEn: string;
  excerptPt: string;
  urls: {
    en: string;
    pt: string;
    proof: string | null;
  };
}) {
  return {
    slug,
    sourceType,
    sourceSlug,
    status: "draft",
    generatedAt: new Date().toISOString(),
    publishedUrl: null,
    urls,
    locales: {
      en: {
        hook: titleEn,
        body: excerptEn,
        cta: "Read the full story on the site and use GitHub as the operational proof point."
      },
      pt: {
        hook: titlePt,
        body: excerptPt,
        cta: "Leia a historia completa no site e use o GitHub como prova operacional."
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
  const projectBySlug = new Map(projects.map((project) => [project.slug, project]));

  for (const article of articles) {
    const relatedProject = article.relatedProjectSlugs
      .map((slug) => projectBySlug.get(slug))
      .find((entry) => Boolean(entry));

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
        urls: {
          en: withSocialUtm(`${siteConfig.url}${localePath("en", `/articles/${article.slug}`)}`, {
            source: "linkedin",
            campaign: article.slug,
            content: "en",
          }),
          pt: withSocialUtm(`${siteConfig.url}${localePath("pt", `/articles/${article.slug}`)}`, {
            source: "linkedin",
            campaign: article.slug,
            content: "pt",
          }),
          proof: relatedProject?.github.url ?? null,
        },
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
        urls: {
          en: withSocialUtm(`${siteConfig.url}${localePath("en", `/projects/${project.slug}`)}`, {
            source: "linkedin",
            campaign: project.slug,
            content: "en",
          }),
          pt: withSocialUtm(`${siteConfig.url}${localePath("pt", `/projects/${project.slug}`)}`, {
            source: "linkedin",
            campaign: project.slug,
            content: "pt",
          }),
          proof: project.github.url,
        },
      }),
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
