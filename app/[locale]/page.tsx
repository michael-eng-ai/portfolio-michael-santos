import Image from "next/image";
import { ArrowRight } from "lucide-react";

import { EntryPaths } from "@/components/entry-paths";
import { NewsCard } from "@/components/news-card";
import { NewsletterForm } from "@/components/newsletter-form";
import { TrackedLink } from "@/components/tracked-link";
import { clampText, editorialLimits } from "@/lib/editorial";
import { getArticles, getNewsReferences, getProjects } from "@/lib/content";
import { buildPageMetadata } from "@/lib/seo";
import { Locale, copy, localePath } from "@/lib/site";

export const revalidate = 600;

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
      "Michael Santos | Data Engineering & AI Strategy",
      "Michael Santos | Estrategia de Dados e IA",
    ),
    description: copy(
      locale,
      "Data pipelines, lakehouse architectures, and AI infrastructure that turn raw data into real-time business decisions. Open-source projects, technical insights, and proven case studies.",
      "Pipelines de dados, arquiteturas lakehouse e infraestrutura de IA que transformam dados brutos em decisoes de negocio em tempo real. Projetos open-source, insights tecnicos e casos comprovados.",
    ),
    keywords: [
      "data engineering portfolio",
      "data pipeline architecture",
      "lakehouse design",
      "real-time analytics",
      "CDC pipeline",
      "dbt databricks",
      "AI data infrastructure",
      "business intelligence automation",
    ],
  });
}

export default async function LocaleHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as Locale;
  const [projects, articles, news] = await Promise.all([
    getProjects(),
    getArticles(),
    getNewsReferences(),
  ]);

  const featuredProjects = projects.filter((project) => project.featured).slice(0, 3);
  const featuredArticles = articles.slice(0, 3);
  const featuredNews = news.slice(0, 3);
  const entryPaths = [
    {
      eyebrow: copy(locale, "Return visits", "Retorno recorrente"),
      title: copy(locale, "Start with market signals", "Comece pelos sinais de mercado"),
      description: copy(
        locale,
        "Use the news layer when you want fresh context, changing platform moves, and reasons to revisit weekly.",
        "Use a camada de noticias quando quiser contexto fresco, movimento de plataformas e motivos para voltar semanalmente.",
      ),
      href: localePath(locale, "/news"),
      target: "news",
      targetType: "news" as const,
      ctaLabel: copy(locale, "Open the signal feed", "Abrir o feed de sinais"),
    },
    {
      eyebrow: copy(locale, "Strategy", "Estrategia"),
      title: copy(locale, "Start with long-form insights", "Comece pelos insights aprofundados"),
      description: copy(
        locale,
        "Go here when you need decision framing, tradeoffs, and a stronger story for stakeholders or hiring.",
        "Va para ca quando precisar de enquadramento de decisao, tradeoffs e uma narrativa mais forte para stakeholders ou contratacao.",
      ),
      href: localePath(locale, "/articles"),
      target: "articles",
      targetType: "article" as const,
      ctaLabel: copy(locale, "Read the strategic notes", "Ler as notas estrategicas"),
    },
    {
      eyebrow: copy(locale, "Proof", "Prova"),
      title: copy(locale, "Start with case studies", "Comece pelos casos de sucesso"),
      description: copy(
        locale,
        "Jump straight into implementation proof, architecture choices, and business impact when you need evidence.",
        "Vá direto para prova de implementacao, escolhas de arquitetura e impacto no negocio quando precisar de evidencia.",
      ),
      href: localePath(locale, "/projects"),
      target: "projects",
      targetType: "project" as const,
      ctaLabel: copy(locale, "Browse the execution proof", "Ver a prova de execucao"),
    },
    {
      eyebrow: copy(locale, "Retention", "Retencao"),
      title: copy(locale, "Stay on the weekly loop", "Fique no loop semanal"),
      description: copy(
        locale,
        "Choose the newsletter if you want the shortest path to repeat value without needing to remember to come back.",
        "Escolha a newsletter se quiser o caminho mais curto para valor recorrente sem precisar lembrar de voltar.",
      ),
      href: localePath(locale, "/newsletter"),
      target: "newsletter",
      targetType: "newsletter" as const,
      ctaLabel: copy(locale, "Get the weekly signal pack", "Receber o pacote semanal"),
    },
  ];

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-20 pt-28 md:px-20 md:pb-24 md:pt-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_22%,rgba(37,99,235,0.22),transparent_28%),radial-gradient(circle_at_82%_14%,rgba(124,58,237,0.16),transparent_22%),linear-gradient(180deg,#f7fbff_0%,#eef5ff_42%,#ffffff_100%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--primary)]/30 to-transparent" />
        <div className="relative mx-auto max-w-7xl">
          <div className="mx-auto max-w-4xl text-center">
              <span className="mb-6 inline-flex rounded-full border border-[var(--primary)]/15 bg-white/70 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--primary)] shadow-sm backdrop-blur">
                {copy(locale, "Data Engineering, AI Strategy, And Market Signals", "Engenharia de Dados, Estrategia de IA e Sinais de Mercado")}
              </span>
              <h1 className="text-4xl font-extrabold leading-[0.92] tracking-tighter text-gray-950 sm:text-5xl md:text-7xl">
                {copy(locale, "From Market Pressure To", "Da Pressao de Mercado ao")}
                <br />
                <span className="gradient-text">
                  {copy(locale, "Intelligent Growth.", "Crescimento Inteligente.")}
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600 sm:text-xl">
                {copy(
                  locale,
                  "Case studies, strategic writing, and curated signals that show how modern data and AI work turns into measurable business leverage.",
                  "Casos, analises estrategicas e sinais curados que mostram como trabalho moderno de dados e IA vira alavancagem mensuravel de negocio.",
                )}
              </p>
              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-5">
                <TrackedLink
                  href={localePath(locale, "/projects")}
                  eventName="navigation_click"
                  eventParams={{ location: "home_hero", target: "projects", locale }}
                  className="w-full rounded-full bg-[var(--primary)] px-10 py-4 text-center text-base font-bold text-white transition hover:opacity-90 sm:w-auto sm:text-lg"
                >
                  {copy(locale, "See How It Works", "Veja Como Funciona")}
                </TrackedLink>
                <TrackedLink
                  href={localePath(locale, "/radar")}
                  eventName="navigation_click"
                  eventParams={{ location: "home_hero", target: "radar", locale }}
                  className="w-full rounded-full border border-gray-300 bg-white px-10 py-4 text-center text-base font-bold text-gray-900 transition hover:border-gray-400 hover:bg-gray-50 sm:w-auto sm:text-lg"
                >
                  {copy(locale, "Explore Tech Radar", "Explorar Tech Radar")}
                </TrackedLink>
              </div>
              <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-gray-600">
                <TrackedLink
                  href={localePath(locale, "/articles")}
                  eventName="navigation_click"
                  eventParams={{ location: "home_hero", target: "articles", locale }}
                  className="inline-flex items-center gap-2 transition hover:text-[var(--primary)]"
                >
                  {copy(locale, "Read the latest insights", "Ler os insights mais recentes")}
                  <ArrowRight aria-hidden="true" size={14} />
                </TrackedLink>
                <TrackedLink
                  href={localePath(locale, "/newsletter")}
                  eventName="navigation_click"
                  eventParams={{ location: "home_hero", target: "newsletter", locale }}
                  className="inline-flex items-center gap-2 transition hover:text-[var(--primary)]"
                >
                  {copy(locale, "Get the weekly signal pack", "Receber o pacote semanal de sinais")}
                  <ArrowRight aria-hidden="true" size={14} />
                </TrackedLink>
              </div>
          </div>
        </div>
      </section>

      {/* Credibility Strip */}
      <section className="border-y border-gray-200 bg-gray-50 px-6 py-10 md:px-20 md:py-12">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 md:grid-cols-4 md:gap-12">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
              {copy(locale, "Cloud Platforms", "Plataformas Cloud")}
            </p>
            <p className="mt-2 text-sm font-bold leading-relaxed text-gray-900">
              AWS &middot; Azure &middot; GCP
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
              {copy(locale, "Data Stack", "Stack de Dados")}
            </p>
            <p className="mt-2 text-sm font-bold leading-relaxed text-gray-900">
              Databricks &middot; Snowflake &middot; dbt &middot; Airflow
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
              {copy(locale, "Pipelines in Production", "Pipelines em Producao")}
            </p>
            <p className="mt-2 text-sm font-bold leading-relaxed text-gray-900">
              {copy(locale, "Batch, CDC & Real-Time Streaming", "Batch, CDC & Streaming em Tempo Real")}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
              {copy(locale, "Everything Open Source", "Tudo Open Source")}
            </p>
            <p className="mt-2 text-sm font-bold leading-relaxed text-gray-900">
              {copy(locale, "Code, architecture & docs on GitHub", "Codigo, arquitetura & docs no GitHub")}
            </p>
          </div>
        </div>
      </section>

      <EntryPaths
        locale={locale}
        eyebrow={copy(locale, "Choose your route", "Escolha sua rota")}
        title={copy(locale, "Use The Site By Intent, Not By Chance", "Use o Site por Intencao, Nao por Acaso")}
        description={copy(
          locale,
          "Different visitors need different entry points. Pick the layer that matches your goal now, then let the internal links move you toward proof, context, and repeat value.",
          "Visitantes diferentes precisam de entradas diferentes. Escolha a camada que combina com seu objetivo agora e deixe os links internos levarem voce ate prova, contexto e retorno recorrente.",
        )}
        paths={entryPaths}
      />

      {/* Market Signals */}
      <section className="px-6 py-24 md:px-20 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--accent-mint)]">
                {copy(locale, "Fresh context", "Contexto atual")}
              </p>
              <h2 className="mt-4 text-3xl font-extrabold uppercase tracking-tight text-gray-900 sm:text-4xl md:text-5xl">
                {copy(locale, "Signals Worth Returning For", "Sinais Que Valem o Retorno")}
              </h2>
              <p className="mt-4 text-lg leading-8 text-gray-600">
                {copy(
                  locale,
                  "The latest references are translated into business context and linked back to concrete delivery patterns. This is the part of the site designed to earn repeat visits.",
                  "As referencias mais recentes sao traduzidas em contexto de negocio e conectadas de volta a padroes concretos de entrega. Esta e a parte do site pensada para gerar retorno recorrente.",
                )}
              </p>
            </div>
            <TrackedLink
              href={localePath(locale, "/news")}
              eventName="navigation_click"
              eventParams={{ location: "home_signals", target: "news", locale }}
              className="group inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.24em] text-[var(--primary)]"
            >
              {copy(locale, "See all signals", "Ver todos os sinais")}
              <ArrowRight aria-hidden="true" size={16} className="transition-transform group-hover:translate-x-1" />
            </TrackedLink>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {featuredNews.map((item) => (
              <NewsCard key={item.slug} item={item} locale={locale} location="home_signals" />
            ))}
          </div>
        </div>
      </section>

      {/* Strategic Matrix - Business Cases */}
      <section className="section-alt px-6 py-24 md:px-20 md:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mb-20">
            <h2 className="mb-4 text-3xl font-extrabold uppercase tracking-tight text-gray-900 sm:text-4xl md:text-5xl">
              {copy(locale, "Real Problems. Real Pipelines.", "Problemas Reais. Pipelines Reais.")}
            </h2>
            <p className="max-w-2xl text-base font-light leading-relaxed text-gray-500 md:text-lg">
              {copy(
                locale,
                "Every project below started with a business bottleneck — not a technology wish list. Scroll through to see how the right data architecture turned operational chaos into measurable clarity.",
                "Cada projeto abaixo comecou com um gargalo de negocio — nao com uma lista de tecnologias. Veja como a arquitetura de dados certa transformou caos operacional em clareza mensuravel.",
              )}
            </p>
          </div>

          <div className="space-y-28">
            {featuredProjects.map((project, idx) => {
              const content = project.locales[locale];
              const isReverse = idx % 2 !== 0;
              return (
                <div key={project.slug} className="grid items-center gap-0 md:grid-cols-2">
                  <div className={`monolith-shadow bg-gray-100 p-8 sm:p-12 md:p-20 ${isReverse ? "md:order-2" : "md:order-1"}`}>
                    <span className="absolute right-10 top-10 text-7xl font-black text-gray-200">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <h3 className="mb-6 text-2xl font-bold uppercase tracking-tight text-gray-500">
                      {copy(locale, "The Challenge", "O Desafio")}
                    </h3>
                    <p className="text-lg leading-relaxed text-gray-500 italic">
                      &ldquo;{clampText(content.businessProblem, 200)}&rdquo;
                    </p>
                  </div>

                  <div className={`monolith-shadow relative z-10 border-l-4 border-[var(--accent-mint)] bg-white p-8 sm:p-12 md:p-20 ${isReverse ? "md:order-1 md:-mr-12" : "md:order-2 md:-ml-12 md:-mt-12"}`}>
                    <div className="mb-6 flex items-center gap-3 text-[var(--accent-mint)]">
                      <span className="text-xs font-bold uppercase tracking-widest">
                        {copy(locale, "Solution", "Solucao")}: {project.stack.slice(0, 2).join(" + ")}
                      </span>
                    </div>
                    <h4 className="mb-6 text-3xl font-extrabold tracking-tighter text-gray-900 md:text-4xl">
                      {clampText(content.title, editorialLimits.cardTitleMax)}
                    </h4>
                    <p className="mb-8 text-lg leading-relaxed text-gray-600">
                      {clampText(content.summary, 180)}
                    </p>
                    <TrackedLink
                      href={localePath(locale, `/projects/${project.slug}`)}
                      eventName="content_card_click"
                      eventParams={{ content_type: "project", slug: project.slug, location: "home_featured_cases", locale }}
                      className="inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.3em] text-gray-900 transition hover:text-[var(--primary)]"
                    >
                      {copy(locale, "Read Case Study", "Ver Caso de Sucesso")}
                      <ArrowRight aria-hidden="true" size={14} className="text-[var(--primary)]" />
                    </TrackedLink>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Success Stories - Featured with images */}
      <section className="px-6 py-24 md:px-20 md:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mb-20 flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <h2 className="mb-6 text-3xl font-extrabold uppercase tracking-tight text-gray-900 sm:text-4xl md:text-5xl">
                {copy(locale, "What Gets Built", "O Que Se Constroi")}
              </h2>
              <p className="text-lg font-light leading-relaxed text-gray-500 md:text-xl">
                {copy(
                  locale,
                  "Dashboards anyone trusts. Pipelines that don't break on Monday morning. Data that arrives before the meeting starts — not after.",
                  "Dashboards em que todos confiam. Pipelines que nao quebram na segunda-feira. Dados que chegam antes da reuniao comecar — nao depois.",
                )}
              </p>
            </div>
            <TrackedLink
              href={localePath(locale, "/projects")}
              eventName="navigation_click"
              eventParams={{ location: "home_showcase", target: "projects", locale }}
              className="group flex items-center gap-3 border-b-2 border-[var(--primary)]/30 pb-2 text-xs font-bold uppercase tracking-[0.2em] text-[var(--primary)] transition-all hover:border-[var(--primary)]"
            >
              {copy(locale, "Full Portfolio", "Portfolio Completo")}
              <ArrowRight aria-hidden="true" size={16} className="transition-transform group-hover:translate-x-1" />
            </TrackedLink>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
            {featuredProjects[0] && (
              <div className="group relative min-h-[350px] overflow-hidden rounded-xl bg-gray-100 sm:min-h-[500px] md:col-span-8">
                {featuredProjects[0].imageUrl && (
                  <Image
                    src={featuredProjects[0].imageUrl}
                    alt={featuredProjects[0].locales[locale].title}
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 66vw"
                    className="object-cover opacity-40 transition-transform duration-1000 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/30 to-transparent" />
                <div className="absolute bottom-0 left-0 p-12">
                  <TrackedLink
                    href={`${localePath(locale, "/articles")}?tag=${encodeURIComponent(featuredProjects[0].tags[0] ?? "data-engineering")}`}
                    eventName="navigation_click"
                    eventParams={{
                      location: "home_showcase",
                      target: "tag",
                      slug: featuredProjects[0].tags[0],
                      locale,
                    }}
                    className="mb-6 inline-block rounded bg-[var(--primary)]/20 px-4 py-1 text-[10px] font-black uppercase tracking-widest text-[var(--primary)] transition hover:bg-[var(--primary)]/30"
                  >
                    {featuredProjects[0].tags[0]}
                  </TrackedLink>
                  <h3 className="mb-6 text-3xl font-extrabold tracking-tighter text-white md:text-4xl">
                    {featuredProjects[0].locales[locale].title}
                  </h3>
                  <p className="mb-8 max-w-lg text-lg text-gray-300">
                    {clampText(featuredProjects[0].locales[locale].summary, 120)}
                  </p>
                  <TrackedLink
                    href={localePath(locale, `/projects/${featuredProjects[0].slug}`)}
                    eventName="content_card_click"
                    eventParams={{ content_type: "project", slug: featuredProjects[0].slug, location: "home_showcase", locale }}
                    className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-white transition hover:text-[var(--primary)]"
                  >
                    {copy(locale, "Read Case Study", "Ver Caso")}
                    <ArrowRight aria-hidden="true" size={14} className="text-[var(--primary)]" />
                  </TrackedLink>
                </div>
              </div>
            )}

            {featuredProjects[1] && (
              <div className="group relative min-h-[350px] overflow-hidden rounded-xl bg-gray-100 sm:min-h-[500px] md:col-span-4">
                {featuredProjects[1].imageUrl && (
                  <Image
                    src={featuredProjects[1].imageUrl}
                    alt={featuredProjects[1].locales[locale].title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover opacity-30 transition-transform duration-1000 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 p-12">
                  <TrackedLink
                    href={`${localePath(locale, "/articles")}?tag=${encodeURIComponent(featuredProjects[1].tags[0] ?? "data-engineering")}`}
                    eventName="navigation_click"
                    eventParams={{
                      location: "home_showcase",
                      target: "tag",
                      slug: featuredProjects[1].tags[0],
                      locale,
                    }}
                    className="mb-6 inline-block rounded bg-[var(--accent-mint)]/20 px-4 py-1 text-[10px] font-black uppercase tracking-widest text-[var(--accent-mint)] transition hover:bg-[var(--accent-mint)]/30"
                  >
                    {featuredProjects[1].tags[0]}
                  </TrackedLink>
                  <h3 className="mb-6 text-2xl font-extrabold tracking-tighter text-white md:text-3xl">
                    {featuredProjects[1].locales[locale].title}
                  </h3>
                  <p className="mb-8 text-lg text-gray-300">
                    {clampText(featuredProjects[1].locales[locale].summary, 80)}
                  </p>
                  <TrackedLink
                    href={localePath(locale, `/projects/${featuredProjects[1].slug}`)}
                    eventName="content_card_click"
                    eventParams={{ content_type: "project", slug: featuredProjects[1].slug, location: "home_showcase", locale }}
                    className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-white transition hover:text-[var(--primary)]"
                  >
                    {copy(locale, "Case Details", "Detalhes do Caso")}
                    <ArrowRight aria-hidden="true" size={14} className="text-[var(--primary)]" />
                  </TrackedLink>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Radar */}
      <section className="section-deep px-6 py-24 md:px-20 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--accent-mint)]">
              {copy(locale, "Opinionated asset", "Ativo opinativo")}
            </p>
            <h2 className="mt-4 text-3xl font-extrabold uppercase tracking-tight text-gray-900 sm:text-4xl md:text-5xl">
              {copy(locale, "A Strong Reason To Come Back", "Um Forte Motivo Para Voltar")}
            </h2>
            <p className="mt-5 text-lg leading-8 text-gray-600">
              {copy(
                locale,
                "The Tech Radar turns experience into a reusable decision tool. It is one of the easiest ways to increase repeat traffic because the value compounds as the market shifts.",
                "O Tech Radar transforma experiencia em uma ferramenta reutilizavel de decisao. E uma das formas mais simples de aumentar retorno recorrente porque o valor cresce conforme o mercado muda.",
              )}
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <TrackedLink
                href={localePath(locale, "/radar")}
                eventName="navigation_click"
                eventParams={{ location: "home_radar", target: "radar", locale }}
                className="inline-flex items-center justify-center rounded-full bg-white px-7 py-4 text-base font-bold text-gray-900 shadow-sm transition hover:bg-gray-50"
              >
                {copy(locale, "Open The Radar", "Abrir o Radar")}
              </TrackedLink>
              <TrackedLink
                href={localePath(locale, "/newsletter")}
                eventName="navigation_click"
                eventParams={{ location: "home_radar", target: "newsletter", locale }}
                className="inline-flex items-center justify-center rounded-full border border-gray-300 px-7 py-4 text-base font-bold text-gray-900 transition hover:border-gray-400 hover:bg-white"
              >
                {copy(locale, "Get Radar Updates", "Receber Atualizacoes do Radar")}
              </TrackedLink>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="section-card rounded-3xl p-6">
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-gray-500">
                {copy(locale, "Coverage", "Cobertura")}
              </p>
              <p className="mt-4 text-4xl font-black tracking-tighter text-gray-950">24</p>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                {copy(locale, "Technologies across processing, storage, orchestration, and AI/ML.", "Tecnologias entre processamento, armazenamento, orquestracao e IA/ML.")}
              </p>
            </div>
            <div className="section-card rounded-3xl p-6">
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-gray-500">
                {copy(locale, "Decision model", "Modelo de decisao")}
              </p>
              <p className="mt-4 text-4xl font-black tracking-tighter text-gray-950">4x4</p>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                {copy(locale, "Four quadrants and four rings to make tradeoffs visible faster.", "Quatro quadrantes e quatro aneis para tornar tradeoffs visiveis mais rapido.")}
              </p>
            </div>
            <div className="section-card rounded-3xl p-6">
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-gray-500">
                {copy(locale, "Use case", "Uso")}
              </p>
              <p className="mt-4 text-2xl font-black tracking-tight text-gray-950">
                {copy(locale, "Planning and hiring", "Planejamento e contratacao")}
              </p>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                {copy(locale, "Useful for executive conversations, roadmap framing, and credibility building.", "Util para conversas executivas, enquadramento de roadmap e construcao de credibilidade.")}
              </p>
            </div>
            <div className="section-card rounded-3xl p-6">
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-gray-500">
                {copy(locale, "Retention play", "Alavanca de retorno")}
              </p>
              <p className="mt-4 text-2xl font-black tracking-tight text-gray-950">
                {copy(locale, "Updated as the stack moves", "Atualizado conforme o stack muda")}
              </p>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                {copy(locale, "A living asset gives people a reason to revisit beyond one-off portfolio browsing.", "Um ativo vivo da ao visitante um motivo para revisitar alem da navegacao pontual de portfolio.")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Intelligence Feed - Articles */}
      <section className="px-6 py-24 md:px-20 md:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mb-20 border-l-[6px] border-[var(--primary)] pl-10">
            <h2 className="text-3xl font-extrabold uppercase tracking-tight text-gray-900 sm:text-4xl">
              {copy(locale, "What I'm Thinking About", "O Que Estou Pensando")}
            </h2>
            <p className="mt-3 max-w-xl text-base font-light leading-relaxed text-gray-500 md:text-lg">
              {copy(
                locale,
                "Patterns I see working. Architectures I'd bet on. Mistakes I've made so you don't have to.",
                "Padroes que vejo funcionando. Arquiteturas em que eu apostaria. Erros que cometi para que voce nao precise.",
              )}
            </p>
          </div>

          <div className="mb-10 flex flex-wrap gap-2">
            {[...new Set(featuredArticles.flatMap((article) => article.tags))].slice(0, 8).map((tag) => (
              <TrackedLink
                key={tag}
                href={`${localePath(locale, "/articles")}?tag=${encodeURIComponent(tag)}`}
                eventName="navigation_click"
                eventParams={{ location: "home_articles", target: "tag", slug: tag, locale }}
                className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-600 transition hover:border-[var(--primary)]/40 hover:text-[var(--primary)]"
              >
                {tag}
              </TrackedLink>
            ))}
          </div>

          <div className="grid gap-10 md:grid-cols-3">
            {featuredArticles.map((article) => {
              const content = article.locales[locale];
              return (
                <TrackedLink
                  key={article.slug}
                  href={localePath(locale, `/articles/${article.slug}`)}
                  eventName="content_card_click"
                  eventParams={{ content_type: "article", slug: article.slug, location: "home_articles", locale }}
                  className="group cursor-pointer bg-white p-10 transition-all duration-500 monolith-shadow hover:bg-gray-50"
                >
                  <time className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
                    {article.publishedAt}
                  </time>
                  <h4 className="mb-8 mt-6 text-xl font-bold uppercase leading-tight tracking-tight text-gray-900 transition-colors group-hover:text-[var(--primary)] md:text-2xl">
                    {clampText(content.title, editorialLimits.cardTitleMax)}
                  </h4>
                  <p className="mb-10 font-light leading-relaxed text-gray-500">
                    {clampText(content.excerpt, 120)}
                  </p>
                  <ArrowRight aria-hidden="true" size={24} className="text-[var(--primary)] transition-transform group-hover:translate-x-2" />
                </TrackedLink>
              );
            })}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="px-6 py-16 md:px-20">
        <div className="mx-auto max-w-7xl">
          <NewsletterForm
            locale={locale}
            source="home-main-cta"
            title={copy(
              locale,
              "Get the weekly signal pack on data, AI, and digital leverage.",
              "Receba o pacote semanal de sinais sobre dados, IA e alavancagem digital.",
            )}
            description={copy(
              locale,
              "One short note per week with the market shift, implementation pattern, and proof worth paying attention to next.",
              "Uma nota curta por semana com a mudanca de mercado, o padrao de implementacao e a prova que vale acompanhar em seguida.",
            )}
          />
        </div>
      </section>
    </main>
  );
}
