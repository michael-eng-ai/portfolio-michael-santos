import Link from "next/link";

import { EditorialCover } from "@/components/editorial-cover";
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
  const businessProblem = clampText(content.businessProblem, editorialLimits.cardContextMax);

  return (
    <article className="section-card overflow-hidden rounded-3xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(109,185,255,0.12)]">
      <EditorialCover
        variant="case"
        eyebrow={copy(locale, "Business case", "Caso de negocio")}
        title={clampText(content.title, editorialLimits.cardTitleMax)}
        supportingText={businessProblem}
        meta={project.stack.slice(0, 3).join(" • ")}
        imageUrl={project.imageUrl}
      />
      <div className="space-y-4 border-t border-white/8 p-5 sm:p-6">
        <div className="flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-white/10 px-3 py-1 text-xs text-blue-200">
              {tag}
            </span>
          ))}
        </div>
        <p className="line-clamp-4 text-sm leading-7 text-slate-300">{summary}</p>
        <div className="flex flex-wrap gap-2 text-xs text-slate-400">
          {project.stack.slice(0, 5).map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
        <div className="flex flex-col items-start gap-3 pt-1 text-sm sm:flex-row sm:items-center">
          <Link
            href={localePath(locale, `/projects/${project.slug}`)}
            className="brand-button-primary rounded-full px-4 py-2 font-medium"
          >
            {copy(locale, "Open business case", "Abrir caso de negocio")}
          </Link>
          <a href={project.github.url} target="_blank" rel="noreferrer" className="text-blue-300 hover:text-blue-200">
            {copy(locale, "Technical proof", "Prova tecnica")}
          </a>
        </div>
      </div>
    </article>
  );
}
