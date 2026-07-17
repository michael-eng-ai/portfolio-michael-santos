import { ArrowRight } from "lucide-react";

import { TrackedLink } from "@/components/tracked-link";
import { type Locale, copy } from "@/lib/site";

type NextContentPromptProps = {
  locale: Locale;
  sourceType: "article" | "project";
  sourceSlug: string;
  href: string;
  title: string;
  description?: string;
  targetType: "article" | "project" | "news" | "radar" | "contact";
  targetSlug?: string;
};

export function NextContentPrompt({
  locale,
  sourceType,
  sourceSlug,
  href,
  title,
  description,
  targetType,
  targetSlug,
}: NextContentPromptProps) {
  return (
    <aside className="my-10 rounded-2xl border border-[var(--primary)]/15 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] p-5 sm:p-6">
      <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--primary)]">
        {copy(locale, "Keep scrolling", "Continue navegando")}
      </p>
      <TrackedLink
        href={href}
        eventName="related_content_click"
        eventParams={{
          source_type: sourceType,
          source_slug: sourceSlug,
          target_type: targetType,
          target_slug: targetSlug,
          locale,
          location: "next_content_prompt",
        }}
        className="group mt-3 flex items-start justify-between gap-4"
      >
        <div>
          <h2 className="text-lg font-semibold text-gray-950 transition group-hover:text-[var(--primary)] sm:text-xl">
            {title}
          </h2>
          {description ? (
            <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p>
          ) : null}
        </div>
        <ArrowRight
          aria-hidden="true"
          size={18}
          className="mt-1 shrink-0 text-[var(--primary)] transition-transform group-hover:translate-x-1"
        />
      </TrackedLink>
    </aside>
  );
}
