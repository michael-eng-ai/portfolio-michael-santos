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
      "Business-facing insights, market signals, and execution cases that turn data engineering and AI into measurable growth.",
      "Insights de negocio, sinais de mercado e casos de execucao que transformam engenharia de dados e IA em crescimento mensuravel.",
    ),
    keywords: [
      "AI insights",
      "data engineering portfolio",
      "business cases",
      "market intelligence",
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
      <section className="relative flex min-h-[85vh] items-center justify-center px-6 pt-20 md:px-20">
        <div className="relative z-10 max-w-4xl text-center">
          <span className="mb-8 inline-block text-xs font-bold uppercase tracking-[0.3em] text-[var(--primary)]">
            {copy(locale, "Precision Data Architecture", "Arquitetura de Dados de Precisao")}
          </span>
          <h1 className="mb-10 text-5xl font-extrabold leading-[0.9] tracking-tighter text-gray-900 md:text-7xl lg:text-8xl">
            {copy(locale, "Turn Complex Data", "Transforme Dados Complexos")}
            <br />
            {copy(locale, "into ", "em ")}
            <span className="gradient-text">
              {copy(locale, "Business Solutions", "Solucoes de Negocio")}
            </span>.
          </h1>
          <p className="mx-auto mb-14 max-w-2xl text-xl font-light leading-relaxed text-gray-500 md:text-2xl">
            {copy(
              locale,
              "Engineering data structures that transform chaotic information into operational excellence and predictive clarity.",
              "Engenharia de estruturas de dados que transformam informacao caotica em excelencia operacional e clareza preditiva.",
            )}
          </p>
          <div className="flex flex-wrap justify-center gap-5">
            <Link
              href={localePath(locale, "/projects")}
              className="brand-button-primary px-10 py-5 text-lg font-bold"
            >
              {copy(locale, "View Success Stories", "Ver Casos de Sucesso")}
            </Link>
            <Link
              href={localePath(locale, "/articles")}
              className="brand-button-secondary px-10 py-5 text-lg font-bold"
            >
              {copy(locale, "Read Insights", "Ler Insights")}
            </Link>
          </div>
        </div>
      </section>

      {/* Strategic Matrix - Business Cases */}
      <section className="section-alt px-6 py-24 md:px-20 md:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mb-20">
            <h2 className="mb-4 text-4xl font-extrabold uppercase tracking-tight text-gray-900 md:text-5xl">
              {copy(locale, "The Strategic Matrix", "A Matriz Estrategica")}
            </h2>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500">
              {copy(locale, "Identifying structural challenges. Engineering monolithic solutions.", "Identificando desafios estruturais. Engenhando solucoes monoliticas.")}
            </p>
          </div>

          <div className="space-y-28">
            {featuredProjects.map((project, idx) => {
              const content = project.locales[locale];
              const isReverse = idx % 2 !== 0;
              return (
                <div key={project.slug} className="grid items-center gap-0 md:grid-cols-2">
                  <div className={`monolith-shadow bg-gray-100 p-12 md:p-20 ${isReverse ? "md:order-2" : "md:order-1"}`}>
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

                  <div className={`monolith-shadow relative z-10 border-l-4 border-[var(--accent-mint)] bg-white p-12 md:p-20 ${isReverse ? "md:order-1 md:-mr-12" : "md:order-2 md:-ml-12 md:-mt-12"}`}>
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
              <h2 className="mb-6 text-4xl font-extrabold uppercase tracking-tight text-gray-900 md:text-5xl">
                {copy(locale, "Success Stories", "Casos de Sucesso")}
              </h2>
              <p className="text-xl font-light leading-relaxed text-gray-500">
                {copy(
                  locale,
                  "Real-world impact through architectural precision. Explore how data engineering drives measurable business outcomes.",
                  "Impacto real atraves de precisao arquitetural. Veja como engenharia de dados gera resultados de negocio mensuraveis.",
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
              <div className="group relative min-h-[500px] overflow-hidden rounded-xl bg-gray-100 md:col-span-8">
                {featuredProjects[0].imageUrl && (
                  <Image
                    src={featuredProjects[0].imageUrl}
                    alt={featuredProjects[0].locales[locale].title}
                    fill
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
              <div className="group relative min-h-[500px] overflow-hidden rounded-xl bg-gray-100 md:col-span-4">
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
            <h2 className="text-4xl font-extrabold uppercase tracking-tight text-gray-900">
              {copy(locale, "The Intelligence Feed", "Feed de Inteligencia")}
            </h2>
            <p className="mt-3 text-xs font-bold uppercase tracking-[0.3em] text-gray-500">
              {copy(locale, "Latest insights from the data frontier", "Ultimos insights da fronteira de dados")}
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
