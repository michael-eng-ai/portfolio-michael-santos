import { ProjectCard } from "@/components/project-card";
import { getProjects } from "@/lib/content";
import { buildPageMetadata } from "@/lib/seo";
import { Locale, copy } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as Locale;

  return buildPageMetadata({
    locale,
    title: copy(
      locale,
      "Business Cases In Data Engineering And AI Delivery",
      "Casos de Negocio em Engenharia de Dados e Entrega de IA",
    ),
    description: copy(
      locale,
      "Execution cases that show how strategy becomes technical delivery and measurable business impact.",
      "Casos de execucao que mostram como a estrategia vira entrega tecnica e impacto de negocio mensuravel.",
    ),
    path: "/projects",
    keywords: ["data engineering projects", "AI case studies", "technical portfolio"],
  });
}

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as Locale;
  const projects = await getProjects();

  return (
    <main className="px-6 pb-20 pt-28 md:px-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 max-w-3xl">
          <h1 className="mb-4 text-4xl font-extrabold uppercase tracking-tight text-gray-900 md:text-5xl">
            {copy(locale, "Success Stories", "Casos de Sucesso")}
          </h1>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500">
            {copy(
              locale,
              "Execution cases built to show value, scale, and operational credibility",
              "Casos de execucao construidos para mostrar valor, escala e credibilidade operacional",
            )}
          </p>
          <p className="mt-6 text-lg font-light leading-relaxed text-gray-500">
            {copy(
              locale,
              "Each case shows how strategic intent becomes technical delivery, helping decision-makers see both the opportunity and the proof behind execution.",
              "Cada caso mostra como a intencao estrategica vira entrega tecnica, ajudando tomadores de decisao a enxergar a oportunidade e a prova por tras da execucao.",
            )}
          </p>
        </div>

        <div className="grid gap-10 md:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard key={project.slug} project={project} locale={locale} />
          ))}
        </div>
      </div>
    </main>
  );
}
