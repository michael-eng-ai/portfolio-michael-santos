import { ArrowRight } from "lucide-react";

import { clampText, editorialLimits } from "@/lib/editorial";
import { Article } from "@/lib/content";
import { Locale, copy, localePath } from "@/lib/site";
import { TrackedLink } from "@/components/tracked-link";

type ArticleCardProps = {
  article: Article;
  locale: Locale;
  location?: string;
};

export function ArticleCard({
  article,
  locale,
  location = "articles_index",
}: ArticleCardProps) {
  const content = article.locales[locale];
  const excerpt = clampText(content.excerpt, editorialLimits.cardSummaryMax);

  return (
    <TrackedLink
      href={localePath(locale, `/articles/${article.slug}`)}
      eventName="content_card_click"
      eventParams={{ content_type: "article", slug: article.slug, location, locale }}
      className="group bg-white p-8 transition-all duration-500 monolith-shadow hover:bg-gray-50 md:p-10"
    >
      <time className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
        {article.publishedAt} — {article.readingMinutes} min
      </time>
      <h3 className="mb-6 mt-4 text-xl font-bold uppercase leading-tight tracking-tight text-gray-900 transition-colors group-hover:text-[var(--primary)] md:text-2xl">
        {clampText(content.title, editorialLimits.cardTitleMax)}
      </h3>
      <p className="mb-8 font-light leading-relaxed text-gray-500">
        {excerpt}
      </p>
      <ArrowRight size={20} aria-hidden="true" className="text-[var(--primary)] transition-transform group-hover:translate-x-2" />
    </TrackedLink>
  );
}
