import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  Mail,
  Newspaper,
} from "lucide-react";

import { TrackedSurface } from "@/components/tracked-surface";
import { TrackedLink } from "@/components/tracked-link";
import { type Locale } from "@/lib/site";

export type EntryPath = {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  target: string;
  targetType: "article" | "project" | "news" | "newsletter";
  ctaLabel: string;
};

type EntryPathsProps = {
  locale: Locale;
  eyebrow: string;
  title: string;
  description: string;
  paths: EntryPath[];
};

const iconByType = {
  article: BookOpen,
  project: BriefcaseBusiness,
  news: Newspaper,
  newsletter: Mail,
} as const;

export function EntryPaths({
  locale,
  eyebrow,
  title,
  description,
  paths,
}: EntryPathsProps) {
  return (
    <TrackedSurface
      as="section"
      className="px-6 py-20 md:px-20 md:py-24"
      eventParams={{
        location: "home_entry_paths",
        surface_type: "entry_paths",
        locale,
        page_type: "home",
      }}
    >
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--primary)]">
            {eyebrow}
          </p>
          <h2 className="mt-4 text-3xl font-extrabold uppercase tracking-tight text-gray-900 sm:text-4xl">
            {title}
          </h2>
          <p className="mt-4 text-base leading-8 text-gray-600 sm:text-lg">
            {description}
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {paths.map((path, index) => {
            const Icon = iconByType[path.targetType];

            return (
              <TrackedLink
                key={path.href}
                href={path.href}
                eventName="navigation_click"
                eventParams={{ location: "home_entry_paths", target: path.target, locale }}
                className="group rounded-3xl border border-gray-200 bg-white p-6 shadow-[0_14px_50px_rgba(15,23,42,0.05)] transition hover:-translate-y-1 hover:border-[var(--primary)]/30 hover:bg-gray-50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gray-500">
                      {String(index + 1).padStart(2, "0")} · {path.eyebrow}
                    </p>
                    <h3 className="mt-3 text-xl font-semibold tracking-tight text-gray-950">
                      {path.title}
                    </h3>
                  </div>
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-[var(--primary)]">
                    <Icon size={18} />
                  </span>
                </div>

                <p className="mt-4 text-sm leading-7 text-gray-600">
                  {path.description}
                </p>

                <div className="mt-6 flex items-center gap-3 border-t border-gray-100 pt-4 text-xs font-bold uppercase tracking-[0.24em] text-[var(--primary)]">
                  {path.ctaLabel}
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </div>
              </TrackedLink>
            );
          })}
        </div>
      </div>
    </TrackedSurface>
  );
}
