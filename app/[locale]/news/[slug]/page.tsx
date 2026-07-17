import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContentJourney, type ContentJourneyStep } from "@/components/content-journey";
import { EditorialCover } from "@/components/editorial-cover";
import { RetentionPanel, type RetentionLink } from "@/components/retention-panel";
import { ShareButtons } from "@/components/share-buttons";
import { StructuredData } from "@/components/structured-data";
import { TopicCluster } from "@/components/topic-cluster";
import { TrackedExternalLink } from "@/components/tracked-external-link";
import { TrackedLink } from "@/components/tracked-link";
import { getTopicClusterRecommendations } from "@/lib/content-recommendations";
import { formatDisplayDate } from "@/lib/date";
import { clampText, editorialLimits, sourceInitials } from "@/lib/editorial";
import { getArticles, getNewsReferenceBySlug, getNewsReferences, getProjects } from "@/lib/content";
import { buildArticleJsonLd, buildBreadcrumbJsonLd, buildPageMetadata, localizedUrl } from "@/lib/seo";
import { Locale, copy, localePath } from "@/lib/site";
import { getTagLabel } from "@/lib/tags";

export const dynamicParams = true;
export const revalidate = 3600;

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
  const editorial = item.editorialAnalysis as Record<string, string> | null;
  const seoTitleKey = `seo_title_${locale}` as string;
  const seoDescKey = `seo_description_${locale}` as string;
  const seoTitle = editorial?.[seoTitleKey];
  const seoDesc = editorial?.[seoDescKey];

  const title = seoTitle
    ? `${seoTitle} | Michael Santos`
    : `${item.locales[locale].title} | Michael Santos`;
  const description = seoDesc || item.locales[locale].summary;

  const meta = await buildPageMetadata({
    locale,
    title,
    description,
    path: `/news/${item.slug}`,
    imageUrl: item.imageUrl ?? undefined,
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
  const [item, projects, articles] = await Promise.all([
    getNewsReferenceBySlug(resolvedParams.slug),
    getProjects(),
    getArticles(),
  ]);

  if (!item) {
    notFound();
  }

  const content = item.locales[locale];
  const editorial = item.editorialAnalysis?.[locale] ?? null;
  const relatedProjects = projects.filter((project) => item.relatedProjectSlugs.includes(project.slug));
  const primaryProject = relatedProjects[0];
  const primaryArticle = articles[0];
  const followOnStep: ContentJourneyStep = primaryProject
    ? {
        eyebrow: copy(locale, "Implementation proof", "Prova de implementacao"),
        title: primaryProject.locales[locale].title,
        description: copy(
          locale,
          "See the delivery pattern that turns this external shift into something operational and measurable.",
          "Veja o padrao de entrega que transforma esta mudanca externa em algo operacional e mensuravel.",
        ),
        targetType: "project",
        targetSlug: primaryProject.slug,
        href: localePath(locale, `/projects/${primaryProject.slug}`),
        ctaLabel: copy(locale, "Open the case study", "Abrir o caso"),
      }
    : {
        eyebrow: copy(locale, "Strategic context", "Contexto estrategico"),
        title: primaryArticle
          ? primaryArticle.locales[locale].title
          : copy(locale, "Read the latest insights", "Ler os ultimos insights"),
        description: copy(
          locale,
          "Step back from the headline and understand the larger pattern behind the signal you just read.",
          "Saia do headline e entenda o padrao maior por tras do sinal que voce acabou de ler.",
        ),
        targetType: "article",
        targetSlug: primaryArticle?.slug,
        href: primaryArticle
          ? localePath(locale, `/articles/${primaryArticle.slug}`)
          : localePath(locale, "/articles"),
        ctaLabel: copy(locale, "Get the bigger picture", "Ver o quadro maior"),
      };
  const journeySteps: ContentJourneyStep[] = [
    {
      eyebrow: copy(locale, "Current signal", "Sinal atual"),
      title: clampText(content.title, editorialLimits.cardTitleMax),
      description: clampText(content.whyItMatters, editorialLimits.articleExcerptMax),
      targetType: "news",
      current: true,
    },
    followOnStep,
    {
      eyebrow: copy(locale, "Repeat-worthy asset", "Ativo de retorno"),
      title: copy(locale, "Open the Tech Radar", "Abrir o Tech Radar"),
      description: copy(
        locale,
        "Use the radar to place this signal inside a broader technology thesis and find another reason to keep exploring.",
        "Use o radar para posicionar este sinal dentro de uma tese tecnologica mais ampla e encontrar mais um motivo para continuar explorando.",
      ),
      targetType: "radar",
      href: localePath(locale, "/radar"),
      ctaLabel: copy(locale, "See where it fits", "Ver onde isso se encaixa"),
    },
  ];
  const retentionLinks: RetentionLink[] = [
    ...relatedProjects.map((project) => ({
      href: localePath(locale, `/projects/${project.slug}`),
      label: project.locales[locale].title,
      description: copy(
        locale,
        "See the concrete delivery pattern connected to this market shift.",
        "Veja o padrao concreto de entrega conectado a esta mudanca de mercado.",
      ),
      targetType: "project" as const,
      targetSlug: project.slug,
    })),
    ...articles.slice(0, 1).map((article) => ({
      href: localePath(locale, `/articles/${article.slug}`),
      label: article.locales[locale].title,
      description: copy(
        locale,
        "Step back from the headline and understand the larger business pattern.",
        "Saia do headline e entenda o padrao maior de negocio.",
      ),
      targetType: "article" as const,
      targetSlug: article.slug,
    })),
    {
      href: localePath(locale, "/radar"),
      label: copy(locale, "Open the Tech Radar", "Abrir o Tech Radar"),
      description: copy(
        locale,
        "Review where this technology fits in the broader stack and what deserves attention next.",
        "Revise onde esta tecnologia se encaixa no stack mais amplo e o que merece atencao na sequencia.",
      ),
      targetType: "radar" as const,
    },
  ].slice(0, 3);
  const topicClusterRecommendations = getTopicClusterRecommendations({
    source: { type: "news", item },
    articles,
    projects,
  });

  return (
    <main className="px-6 pb-20 pt-28 md:px-20">
      <StructuredData
        data={[
          buildArticleJsonLd({
            locale,
            title: content.title,
            description: content.summary,
            path: `/news/${item.slug}`,
            imageUrl: item.imageUrl ?? undefined,
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
      <ContentJourney
        locale={locale}
        sourceType="news"
        sourceSlug={item.slug}
        eyebrow={copy(locale, "Recommended path", "Trilha recomendada")}
        title={copy(
          locale,
          "Turn this signal into a deeper session",
          "Transforme este sinal em uma sessao mais profunda",
        )}
        description={copy(
          locale,
          "Use the signal as the entry point, then move into proof or strategic context before opening a repeat-worthy asset designed to bring you back.",
          "Use o sinal como porta de entrada, depois avance para prova ou contexto estrategico antes de abrir um ativo recorrente desenhado para trazer voce de volta.",
        )}
        location="news_journey"
        steps={journeySteps}
      />
      <div className="mx-auto max-w-7xl grid gap-8 md:grid-cols-2 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="section-card overflow-hidden rounded-2xl">
          <EditorialCover
            variant="news"
            eyebrow={item.category?.[locale] ?? item.sourceName}
            title={clampText(content.title, editorialLimits.cardTitleMax)}
            supportingText={clampText(content.whyItMatters, editorialLimits.articleExcerptMax)}
            meta={`${sourceInitials(item.sourceName)} • ${formatDisplayDate(item.publishedAt, locale)}`}
            imageUrl={item.imageUrl ?? undefined}
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
          <div className="border-b border-gray-100 px-6 py-4 sm:px-8 md:px-10">
            <ShareButtons
              locale={locale}
              url={localizedUrl(locale, `/news/${item.slug}`)}
              title={content.title}
              contentType="news"
              slug={item.slug}
            />
          </div>
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
            <TrackedExternalLink
              href={item.sourceUrl}
              target="_blank"
              rel="noreferrer"
              eventName="external_link_click"
              eventParams={{ channel: "source", location: "news_detail", slug: item.slug }}
              className="mt-6 inline-flex brand-button-primary rounded-full px-5 py-3 font-medium"
            >
              {copy(locale, "Open source reference", "Abrir fonte original")}
            </TrackedExternalLink>
          </div>
        </article>

        <aside className="space-y-6">
          <section className="section-card rounded-2xl p-5 sm:p-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {copy(locale, "Connected business cases", "Casos conectados")}
            </h2>
            <div className="mt-4 space-y-3 text-sm">
              {relatedProjects.map((project) => (
                <TrackedLink
                  key={project.slug}
                  href={localePath(locale, `/projects/${project.slug}`)}
                  eventName="related_content_click"
                  eventParams={{
                    source_type: "news",
                    source_slug: item.slug,
                    target_type: "project",
                    target_slug: project.slug,
                    locale,
                    location: "news_sidebar",
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

      <TopicCluster
        locale={locale}
        sourceType="news"
        sourceSlug={item.slug}
        eyebrow={copy(locale, "Topic cluster", "Cluster do tema")}
        title={copy(
          locale,
          "Follow this signal into proof and strategy",
          "Siga este sinal ate a prova e a estrategia",
        )}
        description={copy(
          locale,
          "Use the external trigger as the start of a deeper path, then keep exploring the same topic through implementation proof and a longer strategic frame.",
          "Use o gatilho externo como inicio de um caminho mais profundo e continue explorando o mesmo tema por meio de prova de implementacao e de um enquadramento estrategico mais amplo.",
        )}
        location="news_topic_cluster"
        recommendations={topicClusterRecommendations}
      />

      <div className="mx-auto max-w-7xl">
        <RetentionPanel
          locale={locale}
          sourceType="news"
          sourceSlug={item.slug}
          title={copy(
            locale,
            "Turn this signal into a repeatable advantage",
            "Transforme este sinal em uma vantagem repetivel",
          )}
          description={copy(
            locale,
            "Use the next step below to move from market signal to implementation proof, then subscribe to keep a weekly pulse on what deserves attention.",
            "Use o proximo passo abaixo para sair do sinal de mercado e chegar a prova de implementacao, depois assine para manter um pulso semanal do que merece atencao.",
          )}
          newsletterSource="news-detail-retention"
          newsletterTitle={copy(
            locale,
            "Get weekly signals with a business and execution lens.",
            "Receba sinais semanais com lente de negocio e execucao.",
          )}
          newsletterDescription={copy(
            locale,
            "The newsletter helps separate short-lived noise from the shifts worth studying, sharing, or acting on.",
            "A newsletter ajuda a separar ruido passageiro das mudancas que valem estudo, compartilhamento ou acao.",
          )}
          links={retentionLinks}
        />
      </div>
    </main>
  );
}
