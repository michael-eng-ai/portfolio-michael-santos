import { NewsListPaginated } from "@/components/news-list-paginated";
import { getNewsReferences } from "@/lib/content";
import { Locale, copy } from "@/lib/site";

export default async function NewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as Locale;
  const news = await getNewsReferences();

  return (
    <main className="container-shell py-16">
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
