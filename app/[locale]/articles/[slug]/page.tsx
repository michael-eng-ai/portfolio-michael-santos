import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EditorialCover } from "@/components/editorial-cover";
import { MarkdownContent } from "@/components/markdown-content";
import { clampText, editorialLimits } from "@/lib/editorial";
import { getArticleBySlug, getArticles, getProjects } from "@/lib/content";
import { Locale, copy, localePath } from "@/lib/site";

export async function generateStaticParams() {
  const articles = await getArticles();
  return articles.flatMap((article) => [{ locale: "en", slug: article.slug }, { locale: "pt", slug: article.slug }]);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const article = await getArticleBySlug(resolvedParams.slug);

  if (!article) {
    return {};
  }

  const locale = resolvedParams.locale as Locale;

  return {
    title: `${article.locales[locale].title} | Michael Barbosa Santos`,
    description: article.locales[locale].excerpt,
  };
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale as Locale;
  const [article, projects] = await Promise.all([
    getArticleBySlug(resolvedParams.slug),
    getProjects(),
  ]);

  if (!article) {
    notFound();
  }

  const content = article.locales[locale];
  const relatedProjects = projects.filter((project) => article.relatedProjectSlugs.includes(project.slug));

  return (
    <main className="container-shell py-16">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="section-card overflow-hidden rounded-[32px]">
          <EditorialCover
            variant="insight"
            eyebrow={article.category[locale]}
            title={clampText(content.title, editorialLimits.cardTitleMax)}
            supportingText={clampText(content.excerpt, editorialLimits.articleExcerptMax)}
            meta={`${article.publishedAt} • ${article.readingMinutes} min`}
            imageUrl={article.imageUrl}
          />
          <div className="p-8 md:p-10">
            <h1 className="sr-only">{content.title}</h1>
            <div>
              <MarkdownContent content={content.body} />
            </div>
          </div>
        </article>

        <aside className="space-y-6">
          <section className="section-card rounded-3xl p-6">
            <h2 className="text-xl font-semibold text-white">
              {copy(locale, "Related business cases", "Casos de negocio relacionados")}
            </h2>
            <div className="mt-4 space-y-3 text-sm">
              {relatedProjects.map((project) => (
                <Link key={project.slug} href={localePath(locale, `/projects/${project.slug}`)} className="block text-blue-300">
                  {project.locales[locale].title}
                </Link>
              ))}
            </div>
          </section>

          <section className="section-card rounded-3xl p-6">
            <h2 className="text-xl font-semibold text-white">
              {copy(locale, "How to read this analysis", "Como ler esta analise")}
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li>1. {copy(locale, "Start with the market and business pressure.", "Comece pela pressao de mercado e de negocio.")}</li>
              <li>2. {copy(locale, "Then connect it to the delivery pattern.", "Depois conecte isso ao padrao de entrega.")}</li>
              <li>3. {copy(locale, "Use the related case for the operational proof.", "Use o caso relacionado para ver a prova operacional.")}</li>
            </ul>
          </section>
        </aside>
      </div>
    </main>
  );
}
