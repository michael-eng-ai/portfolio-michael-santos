import { getArticles } from "@/lib/content";
import { siteConfig } from "@/lib/site";

export async function GET() {
  const articles = await getArticles();

  const items = articles
    .map(
      (article) => `
        <item>
          <title><![CDATA[${article.locales.en.title}]]></title>
          <link>${siteConfig.url}/en/articles/${article.slug}</link>
          <guid>${siteConfig.url}/en/articles/${article.slug}</guid>
          <pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate>
          <description><![CDATA[${article.locales.en.excerpt}]]></description>
        </item>`,
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
    <rss version="2.0">
      <channel>
        <title>${siteConfig.name}</title>
        <link>${siteConfig.url}</link>
        <description>${siteConfig.description}</description>
        ${items}
      </channel>
    </rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
