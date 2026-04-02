import { ArticleCard } from "@/components/article-card";
import { TrackedLink } from "@/components/tracked-link";
import { getArticles } from "@/lib/content";
import { buildPageMetadata } from "@/lib/seo";
import { Locale, copy, localePath } from "@/lib/site";

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
      "Insights On Data Engineering, AI, And Growth",
      "Insights Sobre Engenharia de Dados, IA e Crescimento",
    ),
    description: copy(
      locale,
      "Long-form analysis that connects market pressure, technical execution, and measurable business outcomes.",
      "Analises que conectam pressao de mercado, execucao tecnica e resultados de negocio mensuraveis.",
    ),
    path: "/articles",
    keywords: ["AI articles", "data platform strategy", "digital transformation"],
  });
}

export default async function ArticlesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as Locale;
  const articles = await getArticles();

  return (
    <main className="px-6 pb-20 pt-28 md:px-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 border-l-[6px] border-[var(--primary)] pl-10">
          <h1 className="text-4xl font-extrabold uppercase tracking-tight text-gray-900 md:text-5xl">
            {copy(locale, "The Intelligence Feed", "Feed de Inteligencia")}
          </h1>
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.3em] text-gray-500">
            {copy(
              locale,
              "Executive intelligence on growth, digital leverage, and modern platforms",
              "Inteligencia executiva sobre crescimento, alavancagem digital e plataformas modernas",
            )}
          </p>
          <p className="mt-6 max-w-2xl text-lg font-light leading-relaxed text-gray-500">
            {copy(
              locale,
              "These insights translate technology shifts into strategic language for leaders focused on expansion, efficiency, and stronger decisions.",
              "Esses insights traduzem mudancas de tecnologia em linguagem estrategica para liderancas focadas em expansao, eficiencia e decisoes melhores.",
            )}
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <TrackedLink
              href={localePath(locale, "/newsletter")}
              eventName="navigation_click"
              eventParams={{ location: "articles_index", target: "newsletter", locale }}
              className="inline-flex items-center justify-center rounded-full bg-gray-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-gray-800"
            >
              {copy(locale, "Get weekly insights", "Receber insights semanais")}
            </TrackedLink>
            <TrackedLink
              href={localePath(locale, "/projects")}
              eventName="navigation_click"
              eventParams={{ location: "articles_index", target: "projects", locale }}
              className="inline-flex items-center justify-center rounded-full border border-gray-300 px-6 py-3 text-sm font-bold text-gray-900 transition hover:border-gray-400 hover:bg-gray-50"
            >
              {copy(locale, "See implementation proof", "Ver prova de implementacao")}
            </TrackedLink>
          </div>
        </div>

        <div className="grid gap-10 md:grid-cols-2">
          {articles.map((article) => (
            <ArticleCard key={article.slug} article={article} locale={locale} location="articles_index" />
          ))}
        </div>
      </div>
    </main>
  );
}
