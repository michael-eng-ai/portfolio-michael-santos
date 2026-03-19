import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EditorialCover } from "@/components/editorial-cover";
import { StructuredData } from "@/components/structured-data";
import { clampText, editorialLimits, sourceInitials } from "@/lib/editorial";
import { getNewsReferenceBySlug, getNewsReferences, getProjects } from "@/lib/content";
import { buildArticleJsonLd, buildBreadcrumbJsonLd, buildPageMetadata } from "@/lib/seo";
import { Locale, copy, localePath } from "@/lib/site";

export const dynamicParams = true;
export const revalidate = 60;

export async function generateStaticParams() {
  const news = await getNewsReferences();
  return news.flatMap((item) => [{ locale: "en", slug: item.slug }, { locale: "pt", slug: item.slug }]);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const item = await getNewsReferenceBySlug(resolvedParams.slug);

  if (!item) {
    return {};
  }

  const locale = resolvedParams.locale as Locale;
  return buildPageMetadata({
    locale,
    title: `${item.locales[locale].title} | Michael Barbosa Santos`,
    description: item.locales[locale].summary,
    path: `/news/${item.slug}`,
    imageUrl: item.imageUrl,
    keywords: item.tags,
    type: "article",
    publishedTime: item.publishedAt,
    modifiedTime: item.publishedAt,
  });
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale as Locale;
  const [item, projects] = await Promise.all([
    getNewsReferenceBySlug(resolvedParams.slug),
    getProjects(),
  ]);

  if (!item) {
    notFound();
  }

  const content = item.locales[locale];
  const relatedProjects = projects.filter((project) => item.relatedProjectSlugs.includes(project.slug));

  return (
    <main className="px-6 pb-20 pt-28 md:px-20">
      <StructuredData
        data={[
          buildArticleJsonLd({
            locale,
            title: content.title,
            description: content.summary,
            path: `/news/${item.slug}`,
            imageUrl: item.imageUrl,
            publishedAt: item.publishedAt,
            keywords: item.tags,
            type: "NewsArticle",
          }),
          buildBreadcrumbJsonLd(locale, [
            { name: "Home", path: "/" },
            { name: "News", path: "/news" },
            { name: content.title },
          ]),
        ]}
      />
      <div className="mx-auto max-w-7xl grid gap-8 md:grid-cols-2 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="section-card overflow-hidden rounded-2xl">
          <EditorialCover
            variant="news"
            eyebrow={item.category?.[locale] ?? item.sourceName}
            title={clampText(content.title, editorialLimits.cardTitleMax)}
            supportingText={clampText(content.whyItMatters, editorialLimits.articleExcerptMax)}
            meta={`${sourceInitials(item.sourceName)} • ${item.publishedAt}`}
            imageUrl={item.imageUrl}
          />
          <div className="p-6 sm:p-8 md:p-10">
            <h1 className="sr-only">{content.title}</h1>
            <p className="max-w-3xl text-base leading-8 text-gray-600 sm:text-lg">{content.summary}</p>
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex brand-button-primary rounded-full px-5 py-3 font-medium"
            >
              {copy(locale, "Open source reference", "Abrir fonte original")}
            </a>
          </div>
        </article>

        <aside className="space-y-6">
          <section className="section-card rounded-2xl p-5 sm:p-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {copy(locale, "Connected business cases", "Casos conectados")}
            </h2>
            <div className="mt-4 space-y-3 text-sm">
              {relatedProjects.map((project) => (
                <Link key={project.slug} href={localePath(locale, `/projects/${project.slug}`)} className="block text-[var(--primary)]">
                  {project.locales[locale].title}
                </Link>
              ))}
            </div>
          </section>

          <section className="section-card rounded-2xl p-5 sm:p-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {copy(locale, "Why this signal matters", "Por que esse sinal importa")}
            </h2>
            <p className="mt-4 text-sm text-gray-600">
              {copy(
                locale,
                "External signals make it easier to explain why a topic matters now, which business pressure is rising, and where technical delivery becomes strategically relevant.",
                "Sinais externos ajudam a explicar por que um tema importa agora, qual pressao de negocio esta crescendo e onde a entrega tecnica se torna estrategicamente relevante.",
              )}
            </p>
          </section>
        </aside>
      </div>
    </main>
  );
}
