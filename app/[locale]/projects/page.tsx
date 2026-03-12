import { ProjectCard } from "@/components/project-card";
import { getProjects } from "@/lib/content";
import { Locale, copy } from "@/lib/site";

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as Locale;
  const projects = await getProjects();

  return (
    <main className="container-shell py-16">
      <div className="mb-10 max-w-3xl">
        <p className="text-xs uppercase tracking-[0.3em] text-blue-300">
          {copy(locale, "Business cases", "Casos de negocio")}
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl md:text-5xl">
          {copy(
            locale,
            "Execution cases built to show value, scale, and operational credibility",
            "Casos de execucao construidos para mostrar valor, escala e credibilidade operacional",
          )}
        </h1>
        <p className="mt-4 text-base text-slate-300 sm:text-lg">
          {copy(
            locale,
            "Each case shows how strategic intent becomes technical delivery, helping decision-makers see both the opportunity and the proof behind execution.",
            "Cada caso mostra como a intencao estrategica vira entrega tecnica, ajudando tomadores de decisao a enxergar a oportunidade e a prova por tras da execucao.",
          )}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {projects.map((project) => (
          <ProjectCard key={project.slug} project={project} locale={locale} />
        ))}
      </div>
    </main>
  );
}
