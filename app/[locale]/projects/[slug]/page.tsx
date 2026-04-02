import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContentJourney, type ContentJourneyStep } from "@/components/content-journey";
import { EditorialCover } from "@/components/editorial-cover";
import { MarkdownContent } from "@/components/markdown-content";
import { RetentionPanel, type RetentionLink } from "@/components/retention-panel";
import { StructuredData } from "@/components/structured-data";
import { TopicCluster } from "@/components/topic-cluster";
import { TrackedExternalLink } from "@/components/tracked-external-link";
import { TrackedLink } from "@/components/tracked-link";
import { getTopicClusterRecommendations } from "@/lib/content-recommendations";
import { clampText, editorialLimits } from "@/lib/editorial";
import { getArticles, getGithubRepoSnapshots, getGithubSnapshotForProject, getNewsReferences, getProjectBySlug, getProjects } from "@/lib/content";
import { buildBreadcrumbJsonLd, buildPageMetadata, buildProjectJsonLd } from "@/lib/seo";
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
  const primaryArticle = relatedArticles[0] ?? articles[0];
  const primarySignal = relatedNews[0] ?? news[0];
  const journeySteps: ContentJourneyStep[] = [
    {
      eyebrow: copy(locale, "Current case", "Caso atual"),
      title: clampText(content.title, editorialLimits.cardTitleMax),
      description: clampText(content.summary, editorialLimits.articleExcerptMax),
      targetType: "project",
      current: true,
    },
    {
      eyebrow: copy(locale, "Strategic framing", "Enquadramento estrategico"),
      title: primaryArticle
        ? primaryArticle.locales[locale].title
        : copy(locale, "Read the latest insights", "Ler os ultimos insights"),
      description: copy(
        locale,
        "Translate this implementation proof into executive language, tradeoffs, and a clearer decision story.",
        "Traduza esta prova de implementacao em linguagem executiva, tradeoffs e uma historia de decisao mais clara.",
      ),
      targetType: "article",
      targetSlug: primaryArticle?.slug,
      href: primaryArticle
        ? localePath(locale, `/articles/${primaryArticle.slug}`)
        : localePath(locale, "/articles"),
      ctaLabel: copy(locale, "Read the framing", "Ler o enquadramento"),
    },
    {
      eyebrow: copy(locale, "Live context", "Contexto vivo"),
      title: primarySignal
        ? primarySignal.locales[locale].title
        : copy(locale, "Check the latest market signals", "Ver os sinais mais recentes"),
      description: copy(
        locale,
        "Bring the case back to the present with a market signal that shows why the architecture still matters now.",
        "Traga o caso de volta ao presente com um sinal de mercado que mostra por que a arquitetura ainda importa agora.",
      ),
      targetType: "news",
      targetSlug: primarySignal?.slug,
      href: primarySignal
        ? localePath(locale, `/news/${primarySignal.slug}`)
        : localePath(locale, "/news"),
      ctaLabel: copy(locale, "Reconnect to the market", "Reconectar ao mercado"),
    },
  ];
  const retentionLinks: RetentionLink[] = [
    ...relatedArticles.map((article) => ({
      href: localePath(locale, `/articles/${article.slug}`),
      label: article.locales[locale].title,
      description: copy(
        locale,
        "Read the business framing that explains why this implementation matters.",
        "Leia o enquadramento de negocio que explica por que esta implementacao importa.",
      ),
      targetType: "article" as const,
      targetSlug: article.slug,
    })),
    ...relatedNews.map((item) => ({
      href: localePath(locale, `/news/${item.slug}`),
      label: item.locales[locale].title,
      description: copy(
        locale,
        "See the external signal that reinforces the urgency behind this architecture.",
        "Veja o sinal externo que reforca a urgencia por tras desta arquitetura.",
      ),
      targetType: "news" as const,
      targetSlug: item.slug,
    })),
  ].slice(0, 3);

  if (retentionLinks.length === 0) {
    retentionLinks.push(
      {
        href: localePath(locale, "/articles"),
        label: copy(locale, "Read the strategy notes", "Ler as analises estrategicas"),
        description: copy(
          locale,
          "Connect implementation proof to executive language and decision pressure.",
          "Conecte a prova de implementacao a linguagem executiva e pressao de decisao.",
        ),
        targetType: "article",
      },
      {
        href: localePath(locale, "/news"),
        label: copy(locale, "Check the latest signals", "Checar os sinais mais recentes"),
        description: copy(
          locale,
          "Pair this case with current market context and platform movement.",
          "Combine este caso com contexto atual de mercado e movimento de plataforma.",
        ),
        targetType: "news",
      },
    );
  }

  const topicClusterRecommendations = getTopicClusterRecommendations({
    source: { type: "project", item: project },
    articles,
    news,
  });

  return (
    <main className="px-6 pb-20 pt-28 md:px-20">
      <StructuredData
        data={[
          buildProjectJsonLd({
            locale,
            title: content.title,
            description: content.summary,
            path: `/projects/${project.slug}`,
            imageUrl: project.imageUrl,
            repoUrl: project.github.url,
            keywords: [...project.tags, ...project.stack],
          }),
          buildBreadcrumbJsonLd(locale, [
            { name: "Home", path: "/" },
            { name: "Projects", path: "/projects" },
            { name: content.title },
          ]),
        ]}
      />
      <ContentJourney
        locale={locale}
        sourceType="project"
        sourceSlug={project.slug}
        eyebrow={copy(locale, "Recommended path", "Trilha recomendada")}
        title={copy(
          locale,
          "Get more value from this case in three moves",
          "Extraia mais valor deste caso em tres movimentos",
        )}
        description={copy(
          locale,
          "Use the case as proof, pair it with strategic framing, then reconnect it to live market movement so the page becomes part of a larger narrative.",
          "Use o caso como prova, combine-o com enquadramento estrategico e depois reconecte-o ao movimento vivo do mercado para que a pagina vire parte de uma narrativa maior.",
        )}
        location="project_journey"
        steps={journeySteps}
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
            <TrackedExternalLink
              href={project.github.url}
              target="_blank"
              rel="noreferrer"
              eventName="external_link_click"
              eventParams={{ channel: "github", location: "project_detail", slug: project.slug }}
              className="mt-4 block text-[var(--primary)]"
            >
              {project.github.owner}/{project.github.repo}
            </TrackedExternalLink>
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
                <TrackedLink
                  key={article.slug}
                  href={localePath(locale, `/articles/${article.slug}`)}
                  eventName="related_content_click"
                  eventParams={{
                    source_type: "project",
                    source_slug: project.slug,
                    target_type: "article",
                    target_slug: article.slug,
                    locale,
                    location: "project_sidebar",
                  }}
                  className="block text-[var(--primary)]"
                >
                  {article.locales[locale].title}
                </TrackedLink>
              ))}
              {relatedNews.map((item) => (
                <TrackedLink
                  key={item.slug}
                  href={localePath(locale, `/news/${item.slug}`)}
                  eventName="related_content_click"
                  eventParams={{
                    source_type: "project",
                    source_slug: project.slug,
                    target_type: "news",
                    target_slug: item.slug,
                    locale,
                    location: "project_sidebar",
                  }}
                  className="block text-gray-600"
                >
                  {item.locales[locale].title}
                </TrackedLink>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <TopicCluster
        locale={locale}
        sourceType="project"
        sourceSlug={project.slug}
        eyebrow={copy(locale, "Topic cluster", "Cluster do tema")}
        title={copy(
          locale,
          "Keep this case alive across strategy and market context",
          "Mantenha este caso vivo entre estrategia e contexto de mercado",
        )}
        description={copy(
          locale,
          "Use the same theme in a new format so technical proof turns into a larger narrative with strategic context and current market movement.",
          "Use o mesmo tema em um novo formato para que a prova tecnica vire uma narrativa maior com contexto estrategico e movimento atual de mercado.",
        )}
        location="project_topic_cluster"
        recommendations={topicClusterRecommendations}
      />

      <div className="mx-auto max-w-7xl">
        <RetentionPanel
          locale={locale}
          sourceType="project"
          sourceSlug={project.slug}
          title={copy(
            locale,
            "Keep the proof chain moving",
            "Mantenha a cadeia de prova em movimento",
          )}
          description={copy(
            locale,
            "Use strategy notes and market signals to turn this technical proof into a stronger narrative for hiring, consulting, or stakeholder conversations.",
            "Use analises estrategicas e sinais de mercado para transformar esta prova tecnica em uma narrativa mais forte para contratacao, consultoria ou conversas com stakeholders.",
          )}
          newsletterSource="project-detail-retention"
          newsletterTitle={copy(
            locale,
            "Receive weekly notes that connect execution proof to business pressure.",
            "Receba notas semanais que conectam prova de execucao a pressao de negocio.",
          )}
          newsletterDescription={copy(
            locale,
            "The newsletter packages one market shift, one delivery pattern, and one actionable insight you can reuse.",
            "A newsletter empacota uma mudanca de mercado, um padrao de entrega e um insight acionavel que voce pode reaproveitar.",
          )}
          links={retentionLinks}
        />
      </div>
    </main>
  );
}
