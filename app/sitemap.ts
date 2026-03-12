import type { MetadataRoute } from "next";

import { getArticles, getNewsReferences, getProjects } from "@/lib/content";
import { locales, siteConfig } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, articles, news] = await Promise.all([
    getProjects(),
    getArticles(),
    getNewsReferences(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = locales.flatMap((locale) => [
    {
      url: `${siteConfig.url}/${locale}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteConfig.url}/${locale}/projects`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteConfig.url}/${locale}/articles`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteConfig.url}/${locale}/news`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${siteConfig.url}/${locale}/newsletter`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteConfig.url}/${locale}/resume`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteConfig.url}/${locale}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ]);

  const dynamicRoutes: MetadataRoute.Sitemap = locales.flatMap((locale) => [
    ...projects.map((project) => ({
      url: `${siteConfig.url}/${locale}/projects/${project.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...articles.map((article) => ({
      url: `${siteConfig.url}/${locale}/articles/${article.slug}`,
      lastModified: new Date(article.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...news.map((item) => ({
      url: `${siteConfig.url}/${locale}/news/${item.slug}`,
      lastModified: new Date(item.publishedAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ]);

  return [...staticRoutes, ...dynamicRoutes];
}
