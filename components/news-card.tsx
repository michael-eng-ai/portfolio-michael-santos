import { ArrowRight } from "lucide-react";

import { clampText, editorialLimits, sourceInitials } from "@/lib/editorial";
import { formatDisplayDate } from "@/lib/date";
import { NewsReference } from "@/lib/content";
import { Locale, copy, localePath } from "@/lib/site";
import { getTagLabel } from "@/lib/tags";
import { TrackedExternalLink } from "@/components/tracked-external-link";
import { TrackedLink } from "@/components/tracked-link";

type NewsCardProps = {
  item: NewsReference;
  locale: Locale;
  location?: string;
};

export function NewsCard({
  item,
  locale,
  location = "news_index",
}: NewsCardProps) {
  const content = item.locales[locale];
  const summary = clampText(content.summary, editorialLimits.newsSummaryMax);

  return (
    <article className="group bg-white p-8 transition-all duration-500 monolith-shadow hover:bg-gray-50 md:p-10">
      <time className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
        {sourceInitials(item.sourceName)} — {formatDisplayDate(item.publishedAt, locale)}
      </time>
      <h3 className="mb-4 mt-4 text-xl font-bold uppercase leading-tight tracking-tight text-gray-900 transition-colors group-hover:text-[var(--primary)] md:text-2xl">
        {clampText(content.title, editorialLimits.cardTitleMax)}
      </h3>
      <div className="mb-4 flex flex-wrap gap-2">
        {item.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="rounded bg-[var(--accent-mint)]/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[var(--accent-mint)]">
            {getTagLabel(tag)}
          </span>
        ))}
      </div>
      <p className="mb-8 font-light leading-relaxed text-gray-500">
        {summary}
      </p>
      <div className="flex items-center gap-6">
        <TrackedLink
          href={localePath(locale, `/news/${item.slug}`)}
          eventName="content_card_click"
          eventParams={{ content_type: "news", slug: item.slug, location, locale }}
          className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-gray-900 transition hover:text-[var(--primary)]"
        >
          {copy(locale, "Read Analysis", "Ler Analise")}
          <ArrowRight size={14} aria-hidden="true" className="text-[var(--primary)] transition-transform group-hover:translate-x-1" />
        </TrackedLink>
        <TrackedExternalLink
          href={item.sourceUrl}
          target="_blank"
          rel="noreferrer"
          eventName="external_link_click"
          eventParams={{ channel: "source", location: `${location}_source`, slug: item.slug }}
          className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 transition hover:text-gray-700"
        >
          {copy(locale, "Source", "Fonte")}
        </TrackedExternalLink>
      </div>
    </article>
  );
}
