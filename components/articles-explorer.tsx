"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { ArticleCard } from "@/components/article-card";
import { trackEvent } from "@/lib/analytics";
import type { Article } from "@/lib/content";
import { type Locale, copy } from "@/lib/site";

type ArticlesExplorerProps = {
  locale: Locale;
  articles: Article[];
};

export function ArticlesExplorer({ locale, articles }: ArticlesExplorerProps) {
  const searchParams = useSearchParams();
  const initialTag = searchParams.get("tag") ?? "";
  const initialQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [tag, setTag] = useState(initialTag);

  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const article of articles) {
      for (const value of article.tags) {
        counts.set(value, (counts.get(value) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .slice(0, 16)
      .map(([value]) => value);
  }, [articles]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return articles.filter((article) => {
      if (tag && !article.tags.includes(tag)) {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }
      const haystack = [
        article.locales[locale].title,
        article.locales[locale].excerpt,
        article.category[locale],
        ...article.tags,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [articles, locale, query, tag]);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <label className="block w-full max-w-md">
          <span className="text-xs font-bold uppercase tracking-[0.24em] text-gray-500">
            {copy(locale, "Filter insights", "Filtrar insights")}
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              trackEvent("navigation_click", {
                location: "articles_filter",
                target: "search",
                locale,
              });
            }}
            placeholder={copy(
              locale,
              "Search by topic, stack, or keyword",
              "Busque por tema, stack ou palavra-chave",
            )}
            className="mt-2 w-full rounded-full border border-gray-300 bg-white px-5 py-3 text-sm text-gray-900 outline-none transition focus:border-[var(--primary)]"
          />
        </label>
        <p className="text-sm text-gray-500">
          {filtered.length} / {articles.length}
        </p>
      </div>

      {tags.length > 0 ? (
        <div className="mb-10 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTag("")}
            className={`rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] transition ${
              !tag
                ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                : "border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            {copy(locale, "All", "Todos")}
          </button>
          {tags.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setTag(value === tag ? "" : value);
                trackEvent("navigation_click", {
                  location: "articles_filter",
                  target: "tag",
                  slug: value,
                  locale,
                });
              }}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] transition ${
                tag === value
                  ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      ) : null}

      <div className="grid gap-10 md:grid-cols-2">
        {filtered.map((article) => (
          <ArticleCard
            key={article.slug}
            article={article}
            locale={locale}
            location="articles_index"
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-10 text-sm text-gray-600">
          {copy(
            locale,
            "No insights match this filter. Clear the search or pick another tag.",
            "Nenhum insight corresponde a este filtro. Limpe a busca ou escolha outra tag.",
          )}
        </p>
      ) : null}
    </div>
  );
}
