import { NewsListPaginated } from "@/components/news-list-paginated";
import { getNewsReferences } from "@/lib/content";
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
      "Curated Market Signals For Data, AI, And Digital Strategy",
      "Sinais de Mercado Curados Para Dados, IA e Estrategia Digital",
    ),
    description: copy(
      locale,
      "A filtered view of the external signals shaping investment, operating models, and platform strategy.",
      "Uma visao filtrada dos sinais externos que moldam investimento, modelos operacionais e estrategia de plataforma.",
    ),
    path: "/news",
    keywords: ["AI market signals", "data engineering news", "digital strategy news"],
  });
}

export default async function NewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as Locale;
  const news = await getNewsReferences();

  return (
    <main className="container-shell py-10 sm:py-16">
      <div className="mb-10 max-w-3xl">
        <p className="text-xs uppercase tracking-[0.3em] text-blue-300">
          {copy(locale, "News", "Noticias")}
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl md:text-5xl">
          {copy(
            locale,
            "The market signals behind the next wave of digital advantage",
            "Os sinais de mercado por tras da proxima onda de vantagem digital",
          )}
        </h1>
        <p className="mt-4 text-base text-slate-300 sm:text-lg">
          {copy(
            locale,
            "Curated references help separate short-lived noise from the shifts that influence investment, operating models, and competitive positioning.",
            "Referencias curadas ajudam a separar ruido passageiro das mudancas que influenciam investimento, modelos operacionais e posicionamento competitivo.",
          )}
        </p>
      </div>

      <NewsListPaginated items={news} locale={locale} itemsPerPage={6} />
    </main>
  );
}
