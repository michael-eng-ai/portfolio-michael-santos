import { ArticleCard } from "@/components/article-card";
import { getArticles } from "@/lib/content";
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
    <main className="container-shell py-10 sm:py-16">
      <div className="mb-10 max-w-3xl">
        <p className="text-xs uppercase tracking-[0.3em] text-blue-300">
          {copy(locale, "Insights", "Insights")}
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl md:text-5xl">
          {copy(locale, "Executive intelligence on growth, digital leverage, and modern platforms", "Inteligencia executiva sobre crescimento, alavancagem digital e plataformas modernas")}
        </h1>
        <p className="mt-4 text-base text-slate-300 sm:text-lg">
          {copy(
            locale,
            "These insights translate technology shifts into strategic language for leaders focused on expansion, efficiency, and stronger decisions.",
            "Esses insights traduzem mudancas de tecnologia em linguagem estrategica para liderancas focadas em expansao, eficiencia e decisoes melhores.",
          )}
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {articles.map((article) => (
          <ArticleCard key={article.slug} article={article} locale={locale} />
        ))}
      </div>
    </main>
  );
}
