import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContentJourney, type ContentJourneyStep } from "@/components/content-journey";
import { EditorialCover } from "@/components/editorial-cover";
import { MarkdownContent } from "@/components/markdown-content";
import { RetentionPanel, type RetentionLink } from "@/components/retention-panel";
import { StructuredData } from "@/components/structured-data";
import { TopicCluster } from "@/components/topic-cluster";
import { TrackedLink } from "@/components/tracked-link";
import { getTopicClusterRecommendations } from "@/lib/content-recommendations";
import { clampText, editorialLimits } from "@/lib/editorial";
import { getArticleBySlug, getArticles, getNewsReferences, getProjects } from "@/lib/content";
import { buildArticleJsonLd, buildBreadcrumbJsonLd, buildPageMetadata } from "@/lib/seo";
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

  return buildPageMetadata({
    locale,
    title: `${article.locales[locale].title} | Michael Barbosa Santos`,
    description: article.locales[locale].excerpt,
    path: `/articles/${article.slug}`,
    imageUrl: article.imageUrl,
    keywords: article.tags,
    type: "article",
    publishedTime: article.publishedAt,
    modifiedTime: article.publishedAt,
  });
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale as Locale;
  const [article, projects, news] = await Promise.all([
    getArticleBySlug(resolvedParams.slug),
    getProjects(),
    getNewsReferences(),
  ]);

  if (!article) {
    notFound();
  }

  const content = article.locales[locale];
  const relatedProjects = projects.filter((project) => article.relatedProjectSlugs.includes(project.slug));
  const relatedNews = news.filter((item) => article.relatedNewsSlugs.includes(item.slug));
  const primaryProject = relatedProjects[0] ?? projects[0];
  const journeySteps: ContentJourneyStep[] = [
    {
      eyebrow: copy(locale, "Current insight", "Insight atual"),
      title: clampText(content.title, editorialLimits.cardTitleMax),
      description: clampText(content.excerpt, editorialLimits.articleExcerptMax),
      targetType: "article",
      current: true,
    },
    {
      eyebrow: copy(locale, "Implementation proof", "Prova de implementacao"),
      title: primaryProject
        ? primaryProject.locales[locale].title
        : copy(locale, "Browse the business cases", "Ver os casos de negocio"),
      description: primaryProject
        ? copy(
            locale,
            "Use the matching case study to move from strategic framing into architecture and delivery tradeoffs.",
            "Use o caso correspondente para sair do enquadramento estrategico e entrar em arquitetura e tradeoffs de entrega.",
          )
        : copy(
            locale,
            "Move from strategic framing into concrete architecture and execution patterns.",
            "Saia do enquadramento estrategico e avance para arquitetura concreta e padroes de execucao.",
          ),
      targetType: "project",
      targetSlug: primaryProject?.slug,
      href: primaryProject
        ? localePath(locale, `/projects/${primaryProject.slug}`)
        : localePath(locale, "/projects"),
      ctaLabel: copy(locale, "See the proof", "Ver a prova"),
    },
    {
      eyebrow: copy(locale, "Repeat value", "Valor recorrente"),
      title: copy(
        locale,
        "Get the weekly signal pack",
        "Receba o pacote semanal de sinais",
      ),
      description: copy(
        locale,
        "Stay connected to the next market shift and the next delivery pattern without needing to hunt for them manually.",
        "Fique conectado a proxima mudanca de mercado e ao proximo padrao de entrega sem precisar procurar tudo manualmente.",
      ),
      targetType: "newsletter",
      href: localePath(locale, "/newsletter"),
      ctaLabel: copy(locale, "Join the weekly loop", "Entrar no loop semanal"),
    },
  ];
  const retentionLinks: RetentionLink[] = [
    ...relatedProjects.map((project) => ({
      href: localePath(locale, `/projects/${project.slug}`),
      label: project.locales[locale].title,
      description: copy(
        locale,
        "See the implementation proof and business tradeoffs behind this analysis.",
        "Veja a prova de implementacao e os tradeoffs de negocio por tras desta analise.",
      ),
      targetType: "project" as const,
      targetSlug: project.slug,
    })),
    ...relatedNews.map((item) => ({
      href: localePath(locale, `/news/${item.slug}`),
      label: item.locales[locale].title,
      description: copy(
        locale,
        "Connect the long-form view to the external market signal that makes it urgent now.",
        "Conecte a visao aprofundada ao sinal externo de mercado que torna isso urgente agora.",
      ),
      targetType: "news" as const,
      targetSlug: item.slug,
    })),
  ].slice(0, 3);

  if (retentionLinks.length === 0) {
    retentionLinks.push(
      {
        href: localePath(locale, "/projects"),
        label: copy(locale, "Browse the case studies", "Ver os casos de sucesso"),
        description: copy(
          locale,
          "Jump from strategic framing to concrete delivery patterns.",
          "Saia do enquadramento estrategico para padroes concretos de entrega.",
        ),
        targetType: "project",
      },
      {
        href: localePath(locale, "/news"),
        label: copy(locale, "Review current market signals", "Revisar sinais atuais de mercado"),
        description: copy(
          locale,
          "See which external signals reinforce the argument you just read.",
          "Veja quais sinais externos reforcam o argumento que voce acabou de ler.",
        ),
        targetType: "news",
      },
    );
  }

  const topicClusterRecommendations = getTopicClusterRecommendations({
    source: { type: "article", item: article },
    projects,
    news,
  });

  return (
    <main className="px-6 pb-20 pt-28 md:px-20">
      <StructuredData
        data={[
          buildArticleJsonLd({
            locale,
            title: content.title,
            description: content.excerpt,
            path: `/articles/${article.slug}`,
            imageUrl: article.imageUrl,
            publishedAt: article.publishedAt,
            keywords: article.tags,
          }),
          buildBreadcrumbJsonLd(locale, [
            { name: "Home", path: "/" },
            { name: "Insights", path: "/articles" },
            { name: content.title },
          ]),
        ]}
      />
      <ContentJourney
        locale={locale}
        sourceType="article"
        sourceSlug={article.slug}
        eyebrow={copy(locale, "Recommended path", "Trilha recomendada")}
        title={copy(
          locale,
          "Use this insight in three moves",
          "Use este insight em tres movimentos",
        )}
        description={copy(
          locale,
          "Read the framing, connect it to implementation proof, then keep the weekly signal loop alive so this page turns into a longer relationship with the site.",
          "Leia o enquadramento, conecte-o a prova de implementacao e depois mantenha vivo o loop semanal de sinais para que esta pagina vire uma relacao mais longa com o site.",
        )}
        location="article_journey"
        steps={journeySteps}
      />
      <div className="mx-auto max-w-7xl grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="section-card overflow-hidden rounded-2xl">
          <EditorialCover
            variant="insight"
            eyebrow={article.category[locale]}
            title={clampText(content.title, editorialLimits.cardTitleMax)}
            supportingText={clampText(content.excerpt, editorialLimits.articleExcerptMax)}
            meta={`${article.publishedAt} • ${article.readingMinutes} min`}
            imageUrl={article.imageUrl}
          />
          <div className="p-6 sm:p-8 md:p-10">
            <h1 className="sr-only">{content.title}</h1>
            <div>
              <MarkdownContent content={content.body} />
            </div>
          </div>
        </article>

        <aside className="space-y-6">
          <section className="section-card rounded-2xl p-5 sm:p-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {copy(locale, "Related business cases", "Casos de negocio relacionados")}
            </h2>
            <div className="mt-4 space-y-3 text-sm">
              {relatedProjects.map((project) => (
                <TrackedLink
                  key={project.slug}
                  href={localePath(locale, `/projects/${project.slug}`)}
                  eventName="related_content_click"
                  eventParams={{
                    source_type: "article",
                    source_slug: article.slug,
                    target_type: "project",
                    target_slug: project.slug,
                    locale,
                    location: "article_sidebar",
                  }}
                  className="block text-[var(--primary)]"
                >
                  {project.locales[locale].title}
                </TrackedLink>
              ))}
            </div>
          </section>

          <section className="section-card rounded-2xl p-5 sm:p-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {copy(locale, "Related market signals", "Sinais de mercado relacionados")}
            </h2>
            <div className="mt-4 space-y-3 text-sm">
              {relatedNews.length > 0 ? (
                relatedNews.map((item) => (
                  <TrackedLink
                    key={item.slug}
                    href={localePath(locale, `/news/${item.slug}`)}
                    eventName="related_content_click"
                    eventParams={{
                      source_type: "article",
                      source_slug: article.slug,
                      target_type: "news",
                      target_slug: item.slug,
                      locale,
                      location: "article_sidebar",
                    }}
                    className="block text-gray-600 transition hover:text-[var(--primary)]"
                  >
                    {item.locales[locale].title}
                  </TrackedLink>
                ))
              ) : (
                <p className="text-sm text-gray-600">
                  {copy(
                    locale,
                    "This analysis is strongest when paired with current market signals and a concrete case study.",
                    "Esta analise fica mais forte quando combinada com sinais atuais de mercado e um caso concreto.",
                  )}
                </p>
              )}
            </div>
          </section>
        </aside>
      </div>

      <TopicCluster
        locale={locale}
        sourceType="article"
        sourceSlug={article.slug}
        eyebrow={copy(locale, "Topic cluster", "Cluster do tema")}
        title={copy(
          locale,
          "Explore this theme across proof and live signals",
          "Explore este tema entre prova e sinais vivos",
        )}
        description={copy(
          locale,
          "Stay on the same topic while changing format: move from strategic framing into implementation proof or a fresh market signal that keeps the session moving.",
          "Permaneça no mesmo tema mudando apenas o formato: saia do enquadramento estrategico e avance para prova de implementacao ou para um sinal fresco de mercado que mantenha a sessao em movimento.",
        )}
        location="article_topic_cluster"
        recommendations={topicClusterRecommendations}
      />

      <div className="mx-auto max-w-7xl">
        <RetentionPanel
          locale={locale}
          sourceType="article"
          sourceSlug={article.slug}
          title={copy(
            locale,
            "Turn this idea into an execution path",
            "Transforme esta ideia em um caminho de execucao",
          )}
          description={copy(
            locale,
            "Use the next step below to move from strategy to proof, then subscribe to keep receiving the signals behind future decisions.",
            "Use o proximo passo abaixo para sair da estrategia e chegar a prova, depois assine para continuar recebendo os sinais por tras de futuras decisoes.",
          )}
          newsletterSource="article-detail-retention"
          newsletterTitle={copy(
            locale,
            "Receive the next strategic signal before the market catches up.",
            "Receba o proximo sinal estrategico antes do mercado assimilar.",
          )}
          newsletterDescription={copy(
            locale,
            "Each weekly note connects one market shift, one execution pattern, and one practical proof you can study.",
            "Cada nota semanal conecta uma mudanca de mercado, um padrao de execucao e uma prova pratica que vale estudar.",
          )}
          links={retentionLinks}
        />
      </div>
    </main>
  );
}
