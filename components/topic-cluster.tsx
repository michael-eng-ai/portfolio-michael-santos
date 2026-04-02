"use client";

import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  Newspaper,
  Sparkles,
} from "lucide-react";

import { TrackedSurface } from "@/components/tracked-surface";
import { TrackedLink } from "@/components/tracked-link";
import { type TopicClusterRecommendation } from "@/lib/content-recommendations";
import { clampText, editorialLimits } from "@/lib/editorial";
import { type Locale, copy, localePath } from "@/lib/site";
import { getTagLabel } from "@/lib/tags";

type TopicClusterProps = {
  locale: Locale;
  sourceType: "article" | "project" | "news";
  sourceSlug: string;
  eyebrow: string;
  title: string;
  description: string;
  location: string;
  recommendations: TopicClusterRecommendation[];
};

const iconByType = {
  article: BookOpen,
  project: BriefcaseBusiness,
  news: Newspaper,
} as const;

function getRecommendationHref(
  locale: Locale,
  recommendation: TopicClusterRecommendation,
) {
  return localePath(locale, `/${recommendation.type}s/${recommendation.slug}`.replace("/newss/", "/news/"));
}

function getRecommendationTitle(
  locale: Locale,
  recommendation: TopicClusterRecommendation,
) {
  return recommendation.item.locales[locale].title;
}

function getRecommendationDescription(
  locale: Locale,
  recommendation: TopicClusterRecommendation,
) {
  if (recommendation.type === "project") {
    return clampText(
      recommendation.item.locales[locale].summary,
      editorialLimits.cardSummaryMax,
    );
  }

  if (recommendation.type === "news") {
    return clampText(
      recommendation.item.locales[locale].whyItMatters,
      editorialLimits.articleExcerptMax,
    );
  }

  return clampText(
    recommendation.item.locales[locale].excerpt,
    editorialLimits.cardSummaryMax,
  );
}

function getTypeLabel(locale: Locale, type: TopicClusterRecommendation["type"]) {
  if (type === "project") {
    return copy(locale, "Implementation proof", "Prova de implementacao");
  }

  if (type === "news") {
    return copy(locale, "Market signal", "Sinal de mercado");
  }

  return copy(locale, "Strategic insight", "Insight estrategico");
}

function getReasonLabel(
  locale: Locale,
  recommendation: TopicClusterRecommendation,
) {
  if (recommendation.matchKind === "direct_and_tags") {
    return copy(locale, "Direct match", "Conexao direta");
  }

  if (recommendation.matchKind === "direct") {
    return copy(locale, "Already connected", "Ja conectado");
  }

  if (recommendation.matchKind === "tags") {
    return copy(locale, "Shared theme", "Tema compartilhado");
  }

  return copy(locale, "Good next move", "Bom proximo passo");
}

export function TopicCluster({
  locale,
  sourceType,
  sourceSlug,
  eyebrow,
  title,
  description,
  location,
  recommendations,
}: TopicClusterProps) {
  if (recommendations.length === 0) {
    return null;
  }

  return (
    <TrackedSurface
      as="section"
      className="mx-auto mt-8 max-w-7xl rounded-3xl border border-gray-200 bg-[linear-gradient(180deg,#ffffff_0%,#f6f8fb_100%)] p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] sm:p-8"
      eventParams={{
        location,
        surface_type: "topic_cluster",
        locale,
        source_type: sourceType,
        source_slug: sourceSlug,
        candidate_count: recommendations.length,
        page_type:
          sourceType === "article"
            ? "article_detail"
            : sourceType === "project"
              ? "project_detail"
              : "news_detail",
      }}
    >
      <div className="max-w-3xl">
        <div className="flex items-center gap-3 text-[var(--primary)]">
          <Sparkles size={18} />
          <p className="text-xs font-bold uppercase tracking-[0.3em]">{eyebrow}</p>
        </div>
        <h2 className="mt-4 text-2xl font-semibold tracking-tight text-gray-950 sm:text-3xl">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
          {description}
        </p>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {recommendations.map((recommendation) => {
          const Icon = iconByType[recommendation.type];

          return (
            <TrackedLink
              key={`${recommendation.type}-${recommendation.slug}`}
              href={getRecommendationHref(locale, recommendation)}
              eventName="related_content_click"
              eventParams={{
                source_type: sourceType,
                source_slug: sourceSlug,
                target_type: recommendation.type,
                target_slug: recommendation.slug,
                locale,
                location,
              }}
              className="group rounded-3xl border border-gray-200 bg-white p-5 transition hover:-translate-y-1 hover:border-[var(--primary)]/30 hover:bg-gray-50 sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-[var(--primary)]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--primary)]">
                    {getTypeLabel(locale, recommendation.type)}
                  </span>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-gray-500">
                    {getReasonLabel(locale, recommendation)}
                  </span>
                </div>
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-[var(--primary)]">
                  <Icon size={18} />
                </span>
              </div>

              <h3 className="mt-4 text-lg font-semibold text-gray-950">
                {getRecommendationTitle(locale, recommendation)}
              </h3>
              <p className="mt-3 text-sm leading-7 text-gray-600">
                {getRecommendationDescription(locale, recommendation)}
              </p>

              {recommendation.sharedTags.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {recommendation.sharedTags.slice(0, 3).map((tag) => (
                    <span
                      key={`${recommendation.slug}-${tag}`}
                      className="rounded-full border border-gray-200 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500"
                    >
                      {getTagLabel(tag)}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="mt-6 flex items-center gap-3 border-t border-gray-100 pt-4 text-xs font-bold uppercase tracking-[0.24em] text-[var(--primary)]">
                {copy(locale, "Open this next", "Abrir em seguida")}
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </div>
            </TrackedLink>
          );
        })}
      </div>
    </TrackedSurface>
  );
}
