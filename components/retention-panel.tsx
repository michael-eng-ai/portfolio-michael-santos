import { ArrowRight, Sparkles } from "lucide-react";

import { NewsletterForm } from "@/components/newsletter-form";
import { TrackedSurface } from "@/components/tracked-surface";
import { TrackedLink } from "@/components/tracked-link";
import { type Locale } from "@/lib/site";

export type RetentionLink = {
  href: string;
  label: string;
  description: string;
  targetType: "article" | "project" | "news" | "newsletter" | "contact" | "radar";
  targetSlug?: string;
};

type RetentionPanelProps = {
  locale: Locale;
  sourceType: "article" | "project" | "news";
  sourceSlug: string;
  title: string;
  description: string;
  newsletterSource: string;
  newsletterTitle: string;
  newsletterDescription: string;
  links: RetentionLink[];
};

export function RetentionPanel({
  locale,
  sourceType,
  sourceSlug,
  title,
  description,
  newsletterSource,
  newsletterTitle,
  newsletterDescription,
  links,
}: RetentionPanelProps) {
  return (
    <TrackedSurface
      as="section"
      className="mt-8 grid gap-6 xl:grid-cols-[0.92fr_1.08fr]"
      eventParams={{
        location: "retention_panel",
        surface_type: "retention_panel",
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
      <div className="section-card rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-3 text-[var(--primary)]">
          <Sparkles size={18} />
          <p className="text-xs font-bold uppercase tracking-[0.28em]">
            Continue reading
          </p>
        </div>
        <h2 className="mt-4 text-2xl font-semibold text-gray-900">{title}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-600 sm:text-base">
          {description}
        </p>

        <div className="mt-6 space-y-4">
          {links.map((link) => (
            <TrackedLink
              key={`${link.targetType}-${link.href}`}
              href={link.href}
              eventName="related_content_click"
              eventParams={{
                source_type: sourceType,
                source_slug: sourceSlug,
                target_type: link.targetType,
                target_slug: link.targetSlug,
                locale,
                location: "retention_panel",
              }}
              className="group block rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-[var(--primary)]/25 hover:bg-gray-50"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-base font-semibold text-gray-900 transition-colors group-hover:text-[var(--primary)]">
                    {link.label}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    {link.description}
                  </p>
                </div>
                <ArrowRight
                  size={18}
                  className="mt-1 shrink-0 text-[var(--primary)] transition-transform group-hover:translate-x-1"
                />
              </div>
            </TrackedLink>
          ))}
        </div>
      </div>

      <NewsletterForm
        locale={locale}
        source={newsletterSource}
        title={newsletterTitle}
        description={newsletterDescription}
      />
    </TrackedSurface>
  );
}
