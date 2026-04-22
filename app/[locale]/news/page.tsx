import { NewsListPaginated } from "@/components/news-list-paginated";
import { StructuredData } from "@/components/structured-data";
import { TrackedLink } from "@/components/tracked-link";
import { getNewsReferences } from "@/lib/content";
import {
  buildBreadcrumbJsonLd,
  buildItemListJsonLd,
  buildPageMetadata,
} from "@/lib/seo";
import { Locale, copy, localePath } from "@/lib/site";

export const revalidate = 3600;

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

  const pageTitle = copy(
    locale,
    "Curated Market Signals For Data, AI, And Digital Strategy",
    "Sinais de Mercado Curados Para Dados, IA e Estrategia Digital",
  );
  const pageDescription = copy(
    locale,
    "A filtered view of the external signals shaping investment, operating models, and platform strategy.",
    "Uma visao filtrada dos sinais externos que moldam investimento, modelos operacionais e estrategia de plataforma.",
  );

  return (
    <main className="px-6 pb-20 pt-28 md:px-20">
      <StructuredData
        data={[
          buildItemListJsonLd({
            locale,
            name: pageTitle,
            description: pageDescription,
            path: "/news",
            items: news.slice(0, 30).map((item) => ({
              name: item.locales[locale].title,
              path: `/news/${item.slug}`,
              description: item.locales[locale].summary,
              image: item.imageUrl ?? undefined,
            })),
          }),
          buildBreadcrumbJsonLd(locale, [
            { name: "Home", path: "/" },
            { name: copy(locale, "Market Signals", "Sinais de Mercado") },
          ]),
        ]}
      />
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 max-w-3xl">
          <h1 className="mb-4 text-4xl font-extrabold uppercase tracking-tight text-gray-900 md:text-5xl">
            {copy(locale, "Market Signals", "Sinais de Mercado")}
          </h1>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500">
            {copy(
              locale,
              "The signals behind the next wave of digital advantage",
              "Os sinais por tras da proxima onda de vantagem digital",
            )}
          </p>
          <p className="mt-6 text-lg font-light leading-relaxed text-gray-500">
            {copy(
              locale,
              "Curated references help separate short-lived noise from the shifts that influence investment, operating models, and competitive positioning.",
              "Referencias curadas ajudam a separar ruido passageiro das mudancas que influenciam investimento, modelos operacionais e posicionamento competitivo.",
            )}
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <TrackedLink
              href={localePath(locale, "/radar")}
              eventName="navigation_click"
              eventParams={{ location: "news_index", target: "radar", locale }}
              className="inline-flex items-center justify-center rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-bold text-white transition hover:opacity-90"
            >
              {copy(locale, "Compare with the Tech Radar", "Comparar com o Tech Radar")}
            </TrackedLink>
            <TrackedLink
              href={localePath(locale, "/newsletter")}
              eventName="navigation_click"
              eventParams={{ location: "news_index", target: "newsletter", locale }}
              className="inline-flex items-center justify-center rounded-full border border-gray-300 px-6 py-3 text-sm font-bold text-gray-900 transition hover:border-gray-400 hover:bg-gray-50"
            >
              {copy(locale, "Get weekly market signals", "Receber sinais semanais")}
            </TrackedLink>
          </div>
        </div>

        <NewsListPaginated items={news} locale={locale} itemsPerPage={6} />
      </div>
    </main>
  );
}
