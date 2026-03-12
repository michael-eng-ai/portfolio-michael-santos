import Link from "next/link";

import { EditorialCover } from "@/components/editorial-cover";
import { clampText, editorialLimits, sourceInitials } from "@/lib/editorial";
import { NewsReference } from "@/lib/content";
import { Locale, copy, localePath } from "@/lib/site";

type NewsCardProps = {
  item: NewsReference;
  locale: Locale;
};

export function NewsCard({ item, locale }: NewsCardProps) {
  const content = item.locales[locale];
  const summary = clampText(content.summary, editorialLimits.newsSummaryMax);
  const context = clampText(content.whyItMatters, editorialLimits.whyItMattersMax);

  return (
    <article className="section-card overflow-hidden rounded-3xl">
      <EditorialCover
        variant="news"
        eyebrow={item.category?.[locale] ?? item.sourceName}
        title={clampText(content.title, editorialLimits.cardTitleMax)}
        supportingText={copy(
          locale,
          "Market signal curated for business impact and delivery relevance.",
          "Sinal de mercado curado com foco em impacto de negocio e relevancia de entrega.",
        )}
        meta={`${sourceInitials(item.sourceName)} • ${item.publishedAt}`}
        imageUrl={item.imageUrl}
      />
      <div className="border-t border-white/8 p-5 sm:p-6">
        <div className="flex flex-wrap gap-2">
          {item.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full border border-white/10 px-3 py-1 text-xs text-blue-100/90">
              {tag}
            </span>
          ))}
        </div>
        <p className="mt-4 line-clamp-4 text-sm leading-7 text-slate-300">{summary}</p>
        <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-400">{context}</p>
        <div className="mt-5 flex flex-col items-start gap-3 text-sm sm:flex-row sm:items-center">
          <Link href={localePath(locale, `/news/${item.slug}`)} className="font-medium text-blue-300">
            {copy(locale, "Read analysis", "Ler analise")}
          </Link>
          <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="text-slate-300 hover:text-white">
            {copy(locale, "Source", "Fonte")}
          </a>
        </div>
      </div>
    </article>
  );
}
