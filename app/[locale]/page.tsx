import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

import { NewsletterForm } from "@/components/newsletter-form";
import { clampText, editorialLimits } from "@/lib/editorial";
import { getArticles, getNewsReferences, getProjects } from "@/lib/content";
import { buildPageMetadata } from "@/lib/seo";
import { Locale, copy, localePath, siteConfig } from "@/lib/site";

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

  return (
    <main>
      {/* Hero */}
      <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-6 pt-20 md:min-h-[85vh] md:px-20">
        <Image
          src="https://images.unsplash.com/photo-1639322537228-f710d846310a?w=1920&q=80&auto=format&fit=crop"
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/80 via-gray-900/70 to-gray-900/90" />
        <div className="relative z-10 max-w-4xl text-center">
          <span className="mb-6 inline-block text-xs font-bold uppercase tracking-[0.3em] text-blue-400">
            {copy(locale, "Data Engineering & AI Strategy", "Engenharia de Dados & Estrategia de IA")}
          </span>
          <h1 className="mb-4 text-4xl font-extrabold leading-[0.95] tracking-tighter text-white sm:text-5xl md:text-7xl lg:text-8xl">
            {copy(locale, "Growth Starts", "O Crescimento")}
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
              {copy(locale, "With Your Data.", "Comeca Pelos Dados.")}
            </span>
          </h1>
          <p className="mx-auto mb-10 max-w-xl text-lg font-light leading-relaxed text-gray-300 sm:text-xl">
            {copy(
              locale,
              "Turn raw data into real-time decisions.",
              "Transforme dados brutos em decisoes em tempo real.",
            )}
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-5">
            <Link
              href={localePath(locale, "/projects")}
              className="w-full rounded-full bg-white px-10 py-4 text-center text-base font-bold text-gray-900 transition hover:bg-gray-100 sm:w-auto sm:text-lg"
            >
              {copy(locale, "See How It Works", "Veja Como Funciona")}
            </Link>
            <Link
              href={localePath(locale, "/articles")}
              className="w-full rounded-full bg-white px-10 py-4 text-center text-base font-bold text-gray-900 transition hover:bg-gray-100 sm:w-auto sm:text-lg"
            >
              {copy(locale, "Read the Insights", "Leia os Insights")}
            </Link>
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
                    <Link
                      href={localePath(locale, `/projects/${project.slug}`)}
                      className="inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.3em] text-gray-900 transition hover:text-[var(--primary)]"
                    >
                      {copy(locale, "Read Case Study", "Ver Caso de Sucesso")}
                      <ArrowRight size={14} className="text-[var(--primary)]" />
                    </Link>
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
            <Link
              href={localePath(locale, "/projects")}
              className="group flex items-center gap-3 border-b-2 border-[var(--primary)]/30 pb-2 text-xs font-bold uppercase tracking-[0.2em] text-[var(--primary)] transition-all hover:border-[var(--primary)]"
            >
              {copy(locale, "Full Portfolio", "Portfolio Completo")}
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
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
                  <span className="mb-6 inline-block rounded bg-[var(--primary)]/20 px-4 py-1 text-[10px] font-black uppercase tracking-widest text-[var(--primary)]">
                    {featuredProjects[0].tags[0]}
                  </span>
                  <h3 className="mb-6 text-3xl font-extrabold tracking-tighter text-white md:text-4xl">
                    {featuredProjects[0].locales[locale].title}
                  </h3>
                  <p className="mb-8 max-w-lg text-lg text-gray-300">
                    {clampText(featuredProjects[0].locales[locale].summary, 120)}
                  </p>
                  <Link
                    href={localePath(locale, `/projects/${featuredProjects[0].slug}`)}
                    className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-white transition hover:text-[var(--primary)]"
                  >
                    {copy(locale, "Read Case Study", "Ver Caso")}
                    <ArrowRight size={14} className="text-[var(--primary)]" />
                  </Link>
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
                  <span className="mb-6 inline-block rounded bg-[var(--accent-mint)]/20 px-4 py-1 text-[10px] font-black uppercase tracking-widest text-[var(--accent-mint)]">
                    {featuredProjects[1].tags[0]}
                  </span>
                  <h3 className="mb-6 text-2xl font-extrabold tracking-tighter text-white md:text-3xl">
                    {featuredProjects[1].locales[locale].title}
                  </h3>
                  <p className="mb-8 text-lg text-gray-300">
                    {clampText(featuredProjects[1].locales[locale].summary, 80)}
                  </p>
                  <Link
                    href={localePath(locale, `/projects/${featuredProjects[1].slug}`)}
                    className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-white transition hover:text-[var(--primary)]"
                  >
                    {copy(locale, "Case Details", "Detalhes do Caso")}
                    <ArrowRight size={14} className="text-[var(--primary)]" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Intelligence Feed - Articles */}
      <section className="section-deep px-6 py-24 md:px-20 md:py-32">
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

          <div className="grid gap-10 md:grid-cols-3">
            {featuredArticles.map((article) => {
              const content = article.locales[locale];
              return (
                <Link
                  key={article.slug}
                  href={localePath(locale, `/articles/${article.slug}`)}
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
                  <ArrowRight size={24} className="text-[var(--primary)] transition-transform group-hover:translate-x-2" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="px-6 py-16 md:px-20">
        <div className="mx-auto max-w-7xl">
          <NewsletterForm locale={locale} source="home-hero" />
        </div>
      </section>
    </main>
  );
}
