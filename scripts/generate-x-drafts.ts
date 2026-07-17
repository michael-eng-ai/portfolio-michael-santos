import { promises as fs } from "node:fs";
import path from "node:path";

import { getArticles, getProjects } from "@/lib/content";
import { findLocalArticleCoverUrl } from "@/lib/article-covers";
import { localePath, siteConfig } from "@/lib/site";
import { withSocialUtm } from "@/lib/utm";
import { buildXThreadPosts } from "@/lib/x-draft-copy";

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
  mediaPath,
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
  mediaPath?: string | null;
}) {
  const hasProof = Boolean(urls.proof);
  const enThread = buildXThreadPosts({
    locale: "en",
    sourceType,
    title: titleEn,
    excerpt: excerptEn,
    hasProof,
  });
  const ptThread = buildXThreadPosts({
    locale: "pt",
    sourceType,
    title: titlePt,
    excerpt: excerptPt,
    hasProof,
  });

  const enPosts = [
    buildPost([enThread[0], enThread[1], enThread[2]], urls.en),
  ];
  const ptPosts = [
    buildPost([ptThread[0], ptThread[1], ptThread[2]], urls.pt),
  ];

  if (urls.proof) {
    enPosts.push(buildPost(["Operational proof lives on GitHub."], urls.proof));
    ptPosts.push(buildPost(["A prova operacional esta no GitHub."], urls.proof));
  }

  return {
    slug,
    sourceType,
    sourceSlug,
    status: "draft",
    generatedAt: new Date().toISOString(),
    publishedUrl: null,
    mediaPath: mediaPath ?? null,
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
    const cover = findLocalArticleCoverUrl(article.slug) ?? article.imageUrl;

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
        mediaPath: cover && !cover.endsWith(".svg") ? cover : null,
        urls: {
          en: withSocialUtm(`${siteConfig.url}${localePath("en", `/articles/${article.slug}`)}`, {
            source: "x",
            campaign: article.slug,
            content: "en",
          }),
          pt: withSocialUtm(`${siteConfig.url}${localePath("pt", `/articles/${article.slug}`)}`, {
            source: "x",
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
        mediaPath:
          project.imageUrl && !project.imageUrl.endsWith(".svg") ? project.imageUrl : null,
        urls: {
          en: withSocialUtm(`${siteConfig.url}${localePath("en", `/projects/${project.slug}`)}`, {
            source: "x",
            campaign: project.slug,
            content: "en",
          }),
          pt: withSocialUtm(`${siteConfig.url}${localePath("pt", `/projects/${project.slug}`)}`, {
            source: "x",
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
