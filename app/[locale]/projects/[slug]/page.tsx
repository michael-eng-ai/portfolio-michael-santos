import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EditorialCover } from "@/components/editorial-cover";
import { MarkdownContent } from "@/components/markdown-content";
import { StructuredData } from "@/components/structured-data";
import { clampText, editorialLimits } from "@/lib/editorial";
import { getArticles, getGithubRepoSnapshots, getGithubSnapshotForProject, getNewsReferences, getProjectBySlug, getProjects } from "@/lib/content";
import { buildPageMetadata, buildProjectJsonLd } from "@/lib/seo";
import { Locale, copy, localePath } from "@/lib/site";

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.flatMap((project) => [{ locale: "en", slug: project.slug }, { locale: "pt", slug: project.slug }]);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const project = await getProjectBySlug(resolvedParams.slug);

  if (!project) {
    return {};
  }

  const locale = resolvedParams.locale as Locale;
  const content = project.locales[locale];

  return buildPageMetadata({
    locale,
    title: `${content.title} | Michael Barbosa Santos`,
    description: content.summary,
    path: `/projects/${project.slug}`,
    imageUrl: project.imageUrl,
    keywords: [...project.tags, ...project.stack],
  });
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale as Locale;
  const [project, articles, news, snapshots] = await Promise.all([
    getProjectBySlug(resolvedParams.slug),
    getArticles(),
    getNewsReferences(),
    getGithubRepoSnapshots(),
  ]);

  if (!project) {
    notFound();
  }

  const content = project.locales[locale];
  const relatedArticles = articles.filter((article) => project.relatedArticleSlugs.includes(article.slug));
  const relatedNews = news.filter((item) => project.relatedNewsSlugs.includes(item.slug));
  const snapshot = getGithubSnapshotForProject(project, snapshots);

  return (
    <main className="px-6 pb-20 pt-28 md:px-20">
      <StructuredData
        data={buildProjectJsonLd({
          locale,
          title: content.title,
          description: content.summary,
          path: `/projects/${project.slug}`,
          imageUrl: project.imageUrl,
          repoUrl: project.github.url,
          keywords: [...project.tags, ...project.stack],
        })}
      />
      <div className="mx-auto max-w-7xl mb-8 overflow-hidden rounded-2xl sm:mb-10">
        <EditorialCover
          variant="case"
          eyebrow={copy(locale, "Business case", "Caso de negocio")}
          title={clampText(content.title, editorialLimits.heroTitleMax)}
          supportingText={clampText(content.subtitle, editorialLimits.heroSummaryMax)}
          meta={project.stack.slice(0, 4).join(" • ")}
          imageUrl={project.imageUrl}
        />
      </div>

      <div className="mx-auto max-w-7xl grid gap-8 md:grid-cols-[1fr_1fr] lg:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-8">
          <section className="section-card rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-gray-900">
              {copy(locale, "The challenge", "O desafio")}
            </h2>
            <p className="mt-4 text-gray-600">{content.businessProblem}</p>
          </section>

          <section className="section-card rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-gray-900">
              {copy(locale, "How we solved it", "Como resolvemos")}
            </h2>
            <ul className="mt-4 space-y-3 text-gray-600">
              {content.technicalSolution.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </section>

          <section className="section-card rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-gray-900">
              {copy(locale, "Execution story", "Historia de execucao")}
            </h2>
            <p className="mt-4 text-gray-600">{content.architectureSummary}</p>
            <div className="mt-6">
              <MarkdownContent content={content.body} />
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="section-card rounded-2xl p-5 sm:p-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {copy(locale, "Technical implementation", "Implementacao tecnica")}
            </h2>
            <a href={project.github.url} target="_blank" rel="noreferrer" className="mt-4 block text-[var(--primary)]">
              {project.github.owner}/{project.github.repo}
            </a>
            {snapshot ? (
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-600">
                <div>
                  <p className="text-gray-400">Stars</p>
                  <p>{snapshot.stars}</p>
                </div>
                <div>
                  <p className="text-gray-400">Forks</p>
                  <p>{snapshot.forks}</p>
                </div>
                <div>
                  <p className="text-gray-400">Issues</p>
                  <p>{snapshot.openIssues}</p>
                </div>
                <div>
                  <p className="text-gray-400">Updated</p>
                  <p>{snapshot.updatedAt ?? "-"}</p>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-gray-400">
                {copy(
                  locale,
                  "This block can be enriched with live repository metadata when GitHub sync is configured.",
                  "Este bloco pode ser enriquecido com metadados vivos do repositorio quando a sincronizacao com GitHub estiver configurada.",
                )}
              </p>
            )}
          </section>

          <section className="section-card rounded-2xl p-5 sm:p-6">
            <h2 className="text-xl font-semibold text-gray-900">{copy(locale, "Business impact", "Impacto no negocio")}</h2>
            <ul className="mt-4 space-y-3 text-sm text-gray-600">
              {content.impact.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </section>

          <section className="section-card rounded-2xl p-5 sm:p-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {copy(locale, "Related insights", "Insights relacionados")}
            </h2>
            <div className="mt-4 space-y-3 text-sm">
              {relatedArticles.map((article) => (
                <Link key={article.slug} href={localePath(locale, `/articles/${article.slug}`)} className="block text-[var(--primary)]">
                  {article.locales[locale].title}
                </Link>
              ))}
              {relatedNews.map((item) => (
                <Link key={item.slug} href={localePath(locale, `/news/${item.slug}`)} className="block text-gray-600">
                  {item.locales[locale].title}
                </Link>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
