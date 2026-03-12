import type { MetadataRoute } from "next";

import { getArticles, getNewsReferences, getProjects } from "@/lib/content";
import { locales, siteConfig } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, articles, news] = await Promise.all([
    getProjects(),
    getArticles(),
    getNewsReferences(),
  ]);

  const staticRoutes = locales.flatMap((locale) => [
    `${siteConfig.url}/${locale}`,
    `${siteConfig.url}/${locale}/projects`,
    `${siteConfig.url}/${locale}/articles`,
    `${siteConfig.url}/${locale}/news`,
    `${siteConfig.url}/${locale}/newsletter`,
    `${siteConfig.url}/${locale}/resume`,
    `${siteConfig.url}/${locale}/contact`,
  ]);

  const dynamicRoutes = locales.flatMap((locale) => [
    ...projects.map((project) => `${siteConfig.url}/${locale}/projects/${project.slug}`),
    ...articles.map((article) => `${siteConfig.url}/${locale}/articles/${article.slug}`),
    ...news.map((item) => `${siteConfig.url}/${locale}/news/${item.slug}`),
  ]);

  return [...staticRoutes, ...dynamicRoutes].map((url) => ({
    url,
    lastModified: new Date(),
  }));
}
