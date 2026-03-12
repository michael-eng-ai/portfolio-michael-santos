import Link from "next/link";

import { ArticleCard } from "@/components/article-card";
import { EditorialCover } from "@/components/editorial-cover";
import { NewsCard } from "@/components/news-card";
import { NewsletterForm } from "@/components/newsletter-form";
import { ProjectCard } from "@/components/project-card";
import { clampText, editorialLimits } from "@/lib/editorial";
import { getArticles, getNewsReferences, getProjects } from "@/lib/content";
import { Locale, copy, localePath, siteConfig } from "@/lib/site";

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
  const featuredArticles = articles.slice(0, 2);
  const featuredNews = news.slice(0, 2);
  const heroTitle = copy(
    locale,
    "Turn data and AI into real business growth.",
    "Transforme dados e IA em crescimento real.",
  );
  const heroSummary = copy(
    locale,
    "Insights, cases, and market signals for leaders who want faster decisions, leaner operations, and stronger competitive advantage.",
    "Insights, casos e sinais de mercado para lideres que buscam decisoes mais rapidas, operacoes mais enxutas e vantagem competitiva.",
  );

  return (
    <main className="pb-20">
      <section className="container-shell py-16">
        <div className="brand-shell hero-orb section-card rounded-[36px] p-8 md:p-12">
          <div className="grid gap-10 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="relative z-10 space-y-6">
              <span className="eyebrow-pill">
                {copy(locale, "Data Engineering And AI Intelligence", "Inteligencia em Engenharia de Dados e IA")}
              </span>
              <h1 className="max-w-4xl text-3xl font-semibold leading-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
                {heroTitle}
              </h1>
              <p className="max-w-3xl text-base text-slate-300 sm:text-lg">
                {heroSummary}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={localePath(locale, "/articles")}
                  className="brand-button-primary rounded-full px-5 py-3 font-medium"
                >
                  {copy(locale, "Read insights", "Ler insights")}
                </Link>
                <Link
                  href={localePath(locale, "/projects")}
                  className="brand-button-secondary rounded-full px-5 py-3 font-medium"
                >
                  {copy(locale, "Explore business cases", "Explorar casos de negocio")}
                </Link>
              </div>
              <div className="flex flex-wrap gap-3 pt-3 text-sm text-slate-300">
                <span className="rounded-full border border-white/10 bg-white/4 px-4 py-2">
                  {copy(locale, "Revenue growth", "Aumento de receita")}
                </span>
                <span className="rounded-full border border-white/10 bg-white/4 px-4 py-2">
                  {copy(locale, "Operational efficiency", "Eficiencia operacional")}
                </span>
                <span className="rounded-full border border-white/10 bg-white/4 px-4 py-2">
                  {copy(locale, "Smarter decisions", "Decisoes mais inteligentes")}
                </span>
              </div>
            </div>

            <div className="relative z-10 hidden lg:block">
              <EditorialCover
                variant="insight"
                eyebrow={copy(locale, "Featured", "Destaque")}
                title={copy(locale, "From market signal to business result.", "Do sinal de mercado ao resultado de negocio.")}
                supportingText={copy(
                  locale,
                  "See how leaders use data, AI, and platform strategy to drive measurable outcomes.",
                  "Veja como lideres usam dados, IA e estrategia de plataforma para gerar resultados mensuraveis.",
                )}
                meta={copy(locale, "Executive intelligence", "Inteligencia executiva")}
                imageUrl="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="container-shell grid gap-6 py-6 md:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-blue-300">
              {copy(locale, "Featured insights", "Insights em destaque")}
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">
              {copy(
                locale,
                "Ideas that help leaders create clarity, speed, and competitive advantage",
                "Ideias que ajudam liderancas a criar clareza, velocidade e vantagem competitiva",
              )}
            </h2>
          </div>
          <div className="grid gap-6">
            {featuredArticles.map((article) => (
              <ArticleCard key={article.slug} article={article} locale={locale} />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-blue-300">
              {copy(locale, "Market references", "Referencias de mercado")}
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">
              {copy(
                locale,
                "Signals shaping where digital investment and platform strategy are moving",
                "Sinais que mostram para onde caminham investimento digital e estrategia de plataforma",
              )}
            </h2>
          </div>
          <div className="grid gap-6">
            {featuredNews.map((item) => (
              <NewsCard key={item.slug} item={item} locale={locale} />
            ))}
          </div>
        </div>
      </section>

      <section className="container-shell py-10">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-blue-300">
              {copy(locale, "Business cases", "Casos de negocio")}
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">
              {copy(
                locale,
                "Cases that connect strategic intent to operational execution",
                "Casos que conectam intencao estrategica a execucao operacional",
              )}
            </h2>
          </div>
          <Link href={localePath(locale, "/projects")} className="text-sm text-blue-300">
            {copy(locale, "View all", "Ver todos")}
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featuredProjects.map((project) => (
            <ProjectCard key={project.slug} project={project} locale={locale} />
          ))}
        </div>
      </section>

      <section className="container-shell py-8">
        <NewsletterForm locale={locale} source="home-hero" />
      </section>

      <section className="container-shell py-10">
        <div className="section-card rounded-[32px] p-8 md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-blue-300">
                {copy(locale, "Editorial perspective", "Perspectiva editorial")}
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">
                {copy(
                  locale,
                  "Technology earns attention when it creates business momentum",
                  "Tecnologia ganha relevancia quando cria impulso para o negocio",
                )}
              </h2>
              <p className="mt-4 max-w-2xl text-slate-300">
                {copy(
                  locale,
                  "This publication turns market change, platform decisions, and execution patterns into language that leaders can actually use to make better bets.",
                  "Esta publicacao transforma mudancas de mercado, decisoes de plataforma e padroes de execucao em linguagem que liderancas podem usar para fazer apostas melhores.",
                )}
              </p>
            </div>
            <div className="section-card rounded-3xl p-6">
              <div className="space-y-3 text-sm text-slate-300">
                <p>{copy(locale, "1. Follow market changes in data and AI.", "1. Acompanhe mudancas de mercado em dados e IA.")}</p>
                <p>{copy(locale, "2. Understand the business opportunity behind the trend.", "2. Entenda a oportunidade de negocio por tras da tendencia.")}</p>
                <p>{copy(locale, "3. See how the technical solution can be executed.", "3. Veja como a solucao tecnica pode ser executada.")}</p>
                <p>{copy(locale, "4. Explore the operational implementation in GitHub when needed.", "4. Explore a implementacao operacional no GitHub quando necessario.")}</p>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={siteConfig.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-white/10 px-4 py-2 text-sm text-white"
                >
                  GitHub
                </a>
                <Link href={localePath(locale, "/contact")} className="rounded-full border border-white/10 px-4 py-2 text-sm text-white">
                  {copy(locale, "Contact", "Contato")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
