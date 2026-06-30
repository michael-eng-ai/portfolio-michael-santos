import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  Mail,
  Newspaper,
  Sparkles,
} from "lucide-react";

import { TrackedSurface } from "@/components/tracked-surface";
import { TrackedLink } from "@/components/tracked-link";
import { type Locale, copy } from "@/lib/site";

export type ContentJourneyStep = {
  eyebrow: string;
  title: string;
  description: string;
  targetType: "article" | "project" | "news" | "newsletter" | "contact" | "radar";
  href?: string;
  targetSlug?: string;
  current?: boolean;
  ctaLabel?: string;
};

type ContentJourneyProps = {
  locale: Locale;
  sourceType: "article" | "project" | "news";
  sourceSlug: string;
  eyebrow: string;
  title: string;
  description: string;
  location: string;
  steps: ContentJourneyStep[];
};

const iconByType = {
  article: BookOpen,
  project: BriefcaseBusiness,
  news: Newspaper,
  newsletter: Mail,
  contact: Mail,
  radar: Sparkles,
} as const;

export function ContentJourney({
  locale,
  sourceType,
  sourceSlug,
  eyebrow,
  title,
  description,
  location,
  steps,
}: ContentJourneyProps) {
  return (
    <TrackedSurface
      as="section"
      className="mx-auto mb-8 max-w-7xl rounded-3xl border border-gray-200 bg-[linear-gradient(180deg,#ffffff_0%,#f7fafc_100%)] p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] sm:p-8"
      eventParams={{
        location,
        surface_type: "content_journey",
        locale,
        source_type: sourceType,
        source_slug: sourceSlug,
        page_type:
          sourceType === "article"
            ? "article_detail"
            : sourceType === "project"
              ? "project_detail"
              : "news_detail",
      }}
    >
      <div className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--primary)]">
          {eyebrow}
        </p>
        <h2 className="mt-4 text-2xl font-semibold tracking-tight text-gray-950 sm:text-3xl">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
          {description}
        </p>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {steps.map((step, index) => {
          const Icon = iconByType[step.targetType];
          const cardClasses = step.current
            ? "rounded-3xl border border-[var(--primary)]/20 bg-[var(--primary)]/[0.06] p-5 sm:p-6"
            : "group block rounded-3xl border border-gray-200 bg-white p-5 transition hover:border-[var(--primary)]/30 hover:bg-gray-50 sm:p-6";

          const cardContent = (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gray-500">
                    {String(index + 1).padStart(2, "0")} · {step.eyebrow}
                  </p>
                  <h3 className="mt-3 text-lg font-semibold text-gray-950">
                    {step.title}
                  </h3>
                </div>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-[var(--primary)]">
                  <Icon aria-hidden="true" size={18} />
                </span>
              </div>

              <p className="mt-4 text-sm leading-7 text-gray-600">
                {step.description}
              </p>

              <div className="mt-6 flex items-center justify-between gap-4 border-t border-gray-100 pt-4">
                <span className="text-xs font-bold uppercase tracking-[0.24em] text-gray-500">
                  {step.current
                    ? copy(locale, "You are here", "Voce esta aqui")
                    : (step.ctaLabel ?? copy(locale, "Open next step", "Abrir proximo passo"))}
                </span>
                <ArrowRight aria-hidden="true"
                  size={16}
                  className={`text-[var(--primary)] transition-transform ${step.current ? "" : "group-hover:translate-x-1"}`}
                />
              </div>
            </>
          );

          if (step.current || !step.href) {
            return (
              <div key={`${step.targetType}-${step.title}`} className={cardClasses}>
                {cardContent}
              </div>
            );
          }

          return (
            <TrackedLink
              key={`${step.targetType}-${step.href}`}
              href={step.href}
              eventName="related_content_click"
              eventParams={{
                source_type: sourceType,
                source_slug: sourceSlug,
                target_type: step.targetType,
                target_slug: step.targetSlug,
                locale,
                location,
              }}
              className={cardClasses}
            >
              {cardContent}
            </TrackedLink>
          );
        })}
      </div>
    </TrackedSurface>
  );
}
