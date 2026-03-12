import Link from "next/link";

import { EditorialCover } from "@/components/editorial-cover";
import { clampText, editorialLimits } from "@/lib/editorial";
import { Article } from "@/lib/content";
import { Locale, copy, localePath } from "@/lib/site";

type ArticleCardProps = {
  article: Article;
  locale: Locale;
};

export function ArticleCard({ article, locale }: ArticleCardProps) {
  const content = article.locales[locale];
  const excerpt = clampText(content.excerpt, editorialLimits.cardSummaryMax);

  return (
    <article className="section-card overflow-hidden rounded-3xl">
      <EditorialCover
        variant="insight"
        eyebrow={article.category[locale]}
        title={clampText(content.title, editorialLimits.cardTitleMax)}
        supportingText={copy(
          locale,
          "Executive perspective on data platforms, AI adoption, and delivery strategy.",
          "Perspectiva executiva sobre plataformas de dados, adocao de IA e estrategia de entrega.",
        )}
        meta={`${article.publishedAt} • ${article.readingMinutes} min`}
        imageUrl={article.imageUrl}
      />
      <div className="border-t border-white/8 p-5 sm:p-6">
        <p className="line-clamp-4 text-sm leading-7 text-slate-300">{excerpt}</p>
        <Link
          href={localePath(locale, `/articles/${article.slug}`)}
          className="mt-4 inline-flex text-sm font-medium text-[var(--primary)] transition hover:text-white"
        >
          {copy(locale, "Read insight →", "Ler insight →")}
        </Link>
      </div>
    </article>
  );
}
