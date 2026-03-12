import { promises as fs } from "node:fs";
import path from "node:path";

import { getArticles, getProjects } from "@/lib/content";
import { localePath, siteConfig } from "@/lib/site";

function limitPost(text: string, maxLength = 278) {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

function buildPost(parts: Array<string | null | undefined>, url?: string | null) {
  const content = parts.filter(Boolean).join("\n\n");

  if (!url) {
    return limitPost(content);
  }

  const suffix = `\n\n${url}`;
  const maxContentLength = Math.max(40, 278 - suffix.length);
  const trimmedContent =
    content.length <= maxContentLength
      ? content
      : `${content.slice(0, maxContentLength - 1).trimEnd()}…`;

  return `${trimmedContent}${suffix}`;
}

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
  const enPosts = [
    buildPost([
      titleEn,
      excerptEn,
      "Read on site:",
    ], urls.en),
  ];

  const ptPosts = [
    buildPost([
      titlePt,
      excerptPt,
      "Leia no site:",
    ], urls.pt),
  ];

  if (urls.proof) {
    enPosts.push(
      buildPost([
        "Operational proof lives on GitHub.",
      ], urls.proof),
    );

    ptPosts.push(
      buildPost([
        "A prova operacional esta no GitHub.",
      ], urls.proof),
    );
  }

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
        posts: enPosts,
      },
      pt: {
        posts: ptPosts,
      },
    },
  };
}

async function writeDraft(slug: string, payload: unknown) {
  const targetPath = path.join(process.cwd(), "content", "x", `${slug}.json`);
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
          en: `${siteConfig.url}${localePath("en", `/articles/${article.slug}`)}`,
          pt: `${siteConfig.url}${localePath("pt", `/articles/${article.slug}`)}`,
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
          en: `${siteConfig.url}${localePath("en", `/projects/${project.slug}`)}`,
          pt: `${siteConfig.url}${localePath("pt", `/projects/${project.slug}`)}`,
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
