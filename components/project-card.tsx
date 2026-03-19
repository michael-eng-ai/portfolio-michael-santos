import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { clampText, editorialLimits } from "@/lib/editorial";
import { Project } from "@/lib/content";
import { Locale, copy, localePath } from "@/lib/site";

type ProjectCardProps = {
  project: Project;
  locale: Locale;
};

export function ProjectCard({ project, locale }: ProjectCardProps) {
  const content = project.locales[locale];
  const summary = clampText(content.summary, editorialLimits.cardSummaryMax);

  return (
    <article className="group bg-white p-8 transition-all duration-500 monolith-shadow hover:bg-gray-50 md:p-10">
      <div className="mb-4 flex flex-wrap gap-2">
        {project.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="rounded bg-[var(--primary)]/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[var(--primary)]">
            {tag}
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
        <Link
          href={localePath(locale, `/projects/${project.slug}`)}
          className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-gray-900 transition hover:text-[var(--primary)]"
        >
          {copy(locale, "Read Case Study", "Ver Caso")}
          <ArrowRight size={14} aria-hidden="true" className="text-[var(--primary)] transition-transform group-hover:translate-x-1" />
        </Link>
        <a href={project.github.url} target="_blank" rel="noreferrer" className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 transition hover:text-[var(--accent-mint)]">
          {copy(locale, "GitHub", "GitHub")}
        </a>
      </div>
    </article>
  );
}
