import { NewsletterForm } from "@/components/newsletter-form";
import { TechRadar } from "@/components/tech-radar";
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
      "Data Engineering Tech Radar | Technology Assessment 2026",
      "Tech Radar de Engenharia de Dados | Avaliacao de Tecnologias 2026",
    ),
    description: copy(
      locale,
      "Interactive technology radar for the data engineering ecosystem. Opinionated assessment of tools, frameworks, and platforms across processing, storage, orchestration, and AI/ML.",
      "Radar tecnologico interativo para o ecossistema de engenharia de dados. Avaliacao opinativa de ferramentas, frameworks e plataformas em processamento, armazenamento, orquestracao e IA/ML.",
    ),
    path: "/radar",
    keywords: [
      "tech radar",
      "data engineering tools",
      "technology assessment",
      "data stack comparison",
      "spark vs flink",
      "databricks vs snowflake",
      "modern data stack 2026",
    ],
  });
}

export default async function RadarPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as Locale;

  return (
    <main className="container mx-auto max-w-6xl px-4 pb-20 pt-28 md:px-20">
      <div className="mb-8">
        <h1 className="mb-4 text-4xl font-extrabold uppercase tracking-tight text-gray-900 md:text-5xl">
          {copy(locale, "Data Engineering Tech Radar", "Tech Radar de Engenharia de Dados")}
        </h1>
        <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
          {copy(
            locale,
            "An opinionated snapshot of the data engineering ecosystem. Based on hands-on experience building production pipelines, lakehouses, and AI infrastructure.",
            "Um retrato opinativo do ecossistema de engenharia de dados. Baseado em experiencia pratica construindo pipelines de producao, lakehouses e infraestrutura de IA.",
          )}
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          {copy(locale, "Last updated: April 2026", "Ultima atualizacao: Abril 2026")}
        </p>
      </div>

      <TechRadar locale={locale} />

      <div className="mt-10">
        <NewsletterForm
          locale={locale}
          source="radar-page"
          eyebrow={copy(locale, "Radar updates", "Atualizacoes do Radar")}
          title={copy(
            locale,
            "Get notified when the stack shifts and the radar changes.",
            "Receba aviso quando o stack mudar e o radar for atualizado.",
          )}
          description={copy(
            locale,
            "Use the newsletter to keep a lightweight pulse on what should be adopted, tested, or avoided next.",
            "Use a newsletter para manter um pulso leve do que deve ser adotado, testado ou evitado na sequencia.",
          )}
        />
      </div>
    </main>
  );
}
