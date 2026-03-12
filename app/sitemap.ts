import type { MetadataRoute } from "next";

import { getArticles, getNewsReferences, getProjects } from "@/lib/content";
import { buildLanguageAlternates, localizedUrl } from "@/lib/seo";
import { locales } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, articles, news] = await Promise.all([
    getProjects(),
    getArticles(),
    getNewsReferences(),
  ]);

  function buildEntry(path: string, lastModified: Date, changeFrequency: "daily" | "weekly" | "monthly", priority: number) {
    return (locale: (typeof locales)[number]) => ({
      url: localizedUrl(locale, path),
      lastModified,
      changeFrequency,
      priority,
      alternates: {
        languages: buildLanguageAlternates(path),
      },
    });
  }

  const staticRoutes: MetadataRoute.Sitemap = locales.flatMap((locale) => [
    buildEntry("", new Date(), "weekly", 1)(locale),
    buildEntry("/projects", new Date(), "weekly", 0.9)(locale),
    buildEntry("/articles", new Date(), "weekly", 0.9)(locale),
    buildEntry("/news", new Date(), "daily", 0.8)(locale),
    buildEntry("/newsletter", new Date(), "monthly", 0.7)(locale),
    buildEntry("/resume", new Date(), "monthly", 0.6)(locale),
    buildEntry("/contact", new Date(), "monthly", 0.6)(locale),
  ]);

  const dynamicRoutes: MetadataRoute.Sitemap = locales.flatMap((locale) => [
    ...projects.map((project) => ({
      url: localizedUrl(locale, `/projects/${project.slug}`),
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
      alternates: {
        languages: buildLanguageAlternates(`/projects/${project.slug}`),
      },
    })),
    ...articles.map((article) => ({
      url: localizedUrl(locale, `/articles/${article.slug}`),
      lastModified: new Date(article.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.8,
      alternates: {
        languages: buildLanguageAlternates(`/articles/${article.slug}`),
      },
    })),
    ...news.map((item) => ({
      url: localizedUrl(locale, `/news/${item.slug}`),
      lastModified: new Date(item.publishedAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
      alternates: {
        languages: buildLanguageAlternates(`/news/${item.slug}`),
      },
    })),
  ]);

  return [...staticRoutes, ...dynamicRoutes];
}
