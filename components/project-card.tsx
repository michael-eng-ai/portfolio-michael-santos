import { ArrowRight } from "lucide-react";

import { clampText, editorialLimits } from "@/lib/editorial";
import { Project } from "@/lib/content";
import { Locale, copy, localePath } from "@/lib/site";
import { getTagLabel } from "@/lib/tags";
import { TrackedExternalLink } from "@/components/tracked-external-link";
import { TrackedLink } from "@/components/tracked-link";

type ProjectCardProps = {
  project: Project;
  locale: Locale;
  location?: string;
};

export function ProjectCard({
  project,
  locale,
  location = "projects_index",
}: ProjectCardProps) {
  const content = project.locales[locale];
  const summary = clampText(content.summary, editorialLimits.cardSummaryMax);

  return (
    <article className="group bg-white p-8 transition-all duration-500 monolith-shadow hover:bg-gray-50 md:p-10">
      <div className="mb-4 flex flex-wrap gap-2">
        {project.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="rounded bg-[var(--primary)]/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[var(--primary)]">
            {getTagLabel(tag)}
          </span>
        ))}
      </div>
      <h3 className="mb-4 text-2xl font-extrabold uppercase leading-tight tracking-tight text-gray-900 transition-colors group-hover:text-[var(--primary)]">
        {clampText(content.title, editorialLimits.cardTitleMax)}
      </h3>
      <p className="mb-6 font-light leading-relaxed text-gray-500">
        {summary}
      </p>
      <div className="mb-6 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
        {project.stack.slice(0, 4).map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
      <div className="flex items-center gap-6">
        <TrackedLink
          href={localePath(locale, `/projects/${project.slug}`)}
          eventName="content_card_click"
          eventParams={{ content_type: "project", slug: project.slug, location, locale }}
          className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-gray-900 transition hover:text-[var(--primary)]"
        >
          {copy(locale, "Read Case Study", "Ver Caso")}
          <ArrowRight size={14} aria-hidden="true" className="text-[var(--primary)] transition-transform group-hover:translate-x-1" />
        </TrackedLink>
        <TrackedExternalLink
          href={project.github.url}
          target="_blank"
          rel="noreferrer"
          eventName="external_link_click"
          eventParams={{ channel: "github", location: `${location}_github`, slug: project.slug }}
          className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 transition hover:text-[var(--accent-mint)]"
        >
          {copy(locale, "GitHub", "GitHub")}
        </TrackedExternalLink>
      </div>
    </article>
  );
}
