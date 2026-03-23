import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { clampText, editorialLimits, sourceInitials } from "@/lib/editorial";
import { NewsReference } from "@/lib/content";
import { Locale, copy, localePath } from "@/lib/site";
import { getTagLabel } from "@/lib/tags";

type NewsCardProps = {
  item: NewsReference;
  locale: Locale;
};

export function NewsCard({ item, locale }: NewsCardProps) {
  const content = item.locales[locale];
  const summary = clampText(content.summary, editorialLimits.newsSummaryMax);

  return (
    <article className="group bg-white p-8 transition-all duration-500 monolith-shadow hover:bg-gray-50 md:p-10">
      <time className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
        {sourceInitials(item.sourceName)} — {item.publishedAt}
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
        <Link
          href={localePath(locale, `/news/${item.slug}`)}
          className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-gray-900 transition hover:text-[var(--primary)]"
        >
          {copy(locale, "Read Analysis", "Ler Analise")}
          <ArrowRight size={14} aria-hidden="true" className="text-[var(--primary)] transition-transform group-hover:translate-x-1" />
        </Link>
        <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 transition hover:text-gray-700">
          {copy(locale, "Source", "Fonte")}
        </a>
      </div>
    </article>
  );
}
