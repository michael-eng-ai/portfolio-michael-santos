"use client";

import { useMemo, useState } from "react";

import { NewsCard } from "@/components/news-card";
import { NewsReference } from "@/lib/content";
import { Locale, copy } from "@/lib/site";

type NewsListPaginatedProps = {
  items: NewsReference[];
  locale: Locale;
  itemsPerPage?: number;
};

const ALL_CATEGORY = "__all__";

export function NewsListPaginated({
  items,
  locale,
  itemsPerPage = 6,
}: NewsListPaginatedProps) {
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY);
  const [currentPage, setCurrentPage] = useState(1);

  const categories = useMemo(() => {
    const seen = new Map<string, string>();
    for (const item of items) {
      const label = item.category?.[locale];
      if (label && !seen.has(label)) {
        seen.set(label, label);
      }
    }
    return Array.from(seen.keys());
  }, [items, locale]);

  const filtered = useMemo(() => {
    if (activeCategory === ALL_CATEGORY) return items;
    return items.filter((item) => item.category?.[locale] === activeCategory);
  }, [items, locale, activeCategory]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const pageItems = filtered.slice(startIndex, startIndex + itemsPerPage);

  function handleCategoryChange(category: string) {
    setActiveCategory(category);
    setCurrentPage(1);
  }

  return (
    <div>
      {categories.length > 1 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleCategoryChange(ALL_CATEGORY)}
            className={`min-h-[44px] rounded-full px-5 py-2.5 text-sm font-medium transition ${
              activeCategory === ALL_CATEGORY
                ? "brand-button-primary"
                : "border border-white/12 bg-white/4 text-slate-300 hover:bg-white/8"
            }`}
          >
            {copy(locale, "All", "Todas")}
          </button>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => handleCategoryChange(category)}
              className={`min-h-[44px] rounded-full px-5 py-2.5 text-sm font-medium transition ${
                activeCategory === category
                  ? "brand-button-primary"
                  : "border border-white/12 bg-white/4 text-slate-300 hover:bg-white/8"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {pageItems.map((item) => (
          <NewsCard key={item.slug} item={item} locale={locale} />
        ))}
      </div>

      {pageItems.length === 0 && (
        <p className="py-12 text-center text-slate-400">
          {copy(locale, "No news found for this category.", "Nenhuma noticia encontrada para esta categoria.")}
        </p>
      )}

      {totalPages > 1 && (
        <nav className="mt-10 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            disabled={safeCurrentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="min-h-[44px] rounded-lg border border-white/12 bg-white/4 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/8 disabled:opacity-40"
          >
            {copy(locale, "Previous", "Anterior")}
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => setCurrentPage(page)}
              className={`min-h-[44px] min-w-[44px] rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                page === safeCurrentPage
                  ? "brand-button-primary"
                  : "border border-white/12 bg-white/4 text-slate-300 hover:bg-white/8"
              }`}
            >
              {page}
            </button>
          ))}

          <button
            type="button"
            disabled={safeCurrentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="min-h-[44px] rounded-lg border border-white/12 bg-white/4 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/8 disabled:opacity-40"
          >
            {copy(locale, "Next", "Proxima")}
          </button>
        </nav>
      )}
    </div>
  );
}
