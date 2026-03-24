import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EditorialCover } from "@/components/editorial-cover";
import { StructuredData } from "@/components/structured-data";
import { clampText, editorialLimits, sourceInitials } from "@/lib/editorial";
import { getNewsReferenceBySlug, getNewsReferences, getProjects } from "@/lib/content";
import { buildArticleJsonLd, buildBreadcrumbJsonLd, buildPageMetadata } from "@/lib/seo";
import { Locale, copy, localePath } from "@/lib/site";
import { getTagLabel } from "@/lib/tags";

export const dynamicParams = true;
export const revalidate = 86400;

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
  const meta = await buildPageMetadata({
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
  const hasEditorial = !!item.editorialAnalysis?.[locale];
  return {
    ...meta,
    ...(hasEditorial ? {} : { robots: { index: false, follow: true } }),
  };
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
  const editorial = item.editorialAnalysis?.[locale] ?? null;
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
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 px-6 pt-6 sm:px-8 md:px-10">
              {item.tags.slice(0, 5).map((tag) => (
                <span key={tag} className="rounded bg-[var(--accent-mint)]/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[var(--accent-mint)]">
                  {getTagLabel(tag)}
                </span>
              ))}
            </div>
          )}
          <div className="p-6 sm:p-8 md:p-10">
            <h1 className="sr-only">{content.title}</h1>
            <p className="max-w-3xl text-base leading-8 text-gray-600 sm:text-lg">{content.summary}</p>
            {editorial && (
              <div className="mt-8 border-t border-gray-100 pt-8">
                <h2 className="mb-4 text-lg font-bold text-gray-900">
                  {copy(locale, "Editorial Analysis", "Analise Editorial")}
                </h2>
                <div className="max-w-3xl space-y-4 text-base leading-8 text-gray-700">
                  {editorial.split("\n\n").map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                </div>
              </div>
            )}
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
