"use client";

import { useState } from "react";

import { trackEvent } from "@/lib/analytics";
import {
  type RadarEntry,
  type RadarQuadrant,
  type RadarRing,
  radarEntries,
  radarQuadrants,
  radarRings,
} from "@/content/radar";
import type { Locale } from "@/lib/site";

function MovedIndicator({ moved }: { moved?: "up" | "down" | "none" }) {
  if (!moved || moved === "none") return null;
  return (
    <span className={`ml-1 text-xs ${moved === "up" ? "text-green-500" : "text-red-500"}`}>
      {moved === "up" ? "\u2191" : "\u2193"}
    </span>
  );
}

function RingBadge({ ring, locale }: { ring: RadarRing; locale: Locale }) {
  const config = radarRings[ring];
  return (
    <span
      className="inline-block rounded-full px-2 py-0.5 text-xs font-medium text-white"
      style={{ backgroundColor: config.color }}
    >
      {config.label[locale]}
    </span>
  );
}

function RadarCard({
  entry,
  locale,
  isSelected,
  onClick,
}: {
  entry: RadarEntry;
  locale: Locale;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-lg border p-4 text-left transition-all hover:shadow-md ${
        isSelected
          ? "border-blue-500 bg-blue-500/10 shadow-md"
          : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
          {entry.name}
          <MovedIndicator moved={entry.moved} />
        </h3>
        <RingBadge ring={entry.ring} locale={locale} />
      </div>
      {isSelected && (
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {entry.description[locale]}
        </p>
      )}
    </button>
  );
}

export function TechRadar({ locale }: { locale: Locale }) {
  const [selectedQuadrant, setSelectedQuadrant] = useState<RadarQuadrant | "all">("all");
  const [selectedRing, setSelectedRing] = useState<RadarRing | "all">("all");
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  const filtered = radarEntries.filter((entry) => {
    if (selectedQuadrant !== "all" && entry.quadrant !== selectedQuadrant) return false;
    if (selectedRing !== "all" && entry.ring !== selectedRing) return false;
    return true;
  });

  const ringOrder: RadarRing[] = ["adopt", "trial", "assess", "hold"];
  const sorted = [...filtered].sort(
    (a, b) => ringOrder.indexOf(a.ring) - ringOrder.indexOf(b.ring),
  );

  const quadrantLabel = locale === "pt" ? "Quadrante" : "Quadrant";
  const ringLabel = locale === "pt" ? "Anel" : "Ring";
  const allLabel = locale === "pt" ? "Todos" : "All";
  const countLabel = locale === "pt" ? "tecnologias" : "technologies";

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 uppercase">
            {quadrantLabel}
          </label>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => {
                trackEvent("radar_filter_change", {
                  locale,
                  filter_type: "quadrant",
                  value: "all",
                });
                setSelectedQuadrant("all");
              }}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                selectedQuadrant === "all"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {allLabel}
            </button>
            {(Object.keys(radarQuadrants) as RadarQuadrant[]).map((q) => (
              <button
                type="button"
                key={q}
                onClick={() => {
                  trackEvent("radar_filter_change", {
                    locale,
                    filter_type: "quadrant",
                    value: q,
                  });
                  setSelectedQuadrant(q);
                }}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  selectedQuadrant === q
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                {radarQuadrants[q].label[locale]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500 uppercase">
            {ringLabel}
          </label>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => {
                trackEvent("radar_filter_change", {
                  locale,
                  filter_type: "ring",
                  value: "all",
                });
                setSelectedRing("all");
              }}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                selectedRing === "all"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {allLabel}
            </button>
            {ringOrder.map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => {
                  trackEvent("radar_filter_change", {
                    locale,
                    filter_type: "ring",
                    value: r,
                  });
                  setSelectedRing(r);
                }}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  selectedRing === r
                    ? "text-white"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
                style={selectedRing === r ? { backgroundColor: radarRings[r].color } : undefined}
              >
                {radarRings[r].label[locale]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="text-sm text-zinc-500">
        {sorted.length} {countLabel}
      </p>

      {/* Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((entry) => (
          <RadarCard
            key={entry.name}
            entry={entry}
            locale={locale}
            isSelected={expandedEntry === entry.name}
            onClick={() => {
              const nextValue = expandedEntry === entry.name ? null : entry.name;
              trackEvent("radar_entry_expand", {
                locale,
                entry_name: entry.name,
                state: nextValue ? "expanded" : "collapsed",
              });
              setExpandedEntry(nextValue);
            }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="mt-8 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h4 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          {locale === "pt" ? "Legenda" : "Legend"}
        </h4>
        <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
          {ringOrder.map((ring) => (
            <div key={ring} className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: radarRings[ring].color }}
              />
              <span className="font-medium">{radarRings[ring].label[locale]}</span>
              <span className="text-zinc-500">
                {ring === "adopt" && (locale === "pt" ? "- Usar em producao" : "- Use in production")}
                {ring === "trial" && (locale === "pt" ? "- Testar em projetos" : "- Try in projects")}
                {ring === "assess" && (locale === "pt" ? "- Pesquisar e avaliar" : "- Research and evaluate")}
                {ring === "hold" && (locale === "pt" ? "- Evitar para novos" : "- Avoid for new projects")}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-4 text-xs text-zinc-500">
          <span>{"\u2191"} {locale === "pt" ? "Subiu desde ultima atualizacao" : "Moved up since last update"}</span>
          <span>{"\u2193"} {locale === "pt" ? "Desceu desde ultima atualizacao" : "Moved down since last update"}</span>
        </div>
      </div>
    </div>
  );
}
