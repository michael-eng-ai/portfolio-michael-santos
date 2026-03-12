import { NewsletterForm } from "@/components/newsletter-form";
import { Locale, copy } from "@/lib/site";

export default async function NewsletterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as Locale;

  return (
    <main className="container-shell py-16">
      <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr]">
        <section className="section-card rounded-[32px] p-8 md:p-10">
          <p className="text-xs uppercase tracking-[0.3em] text-blue-300">
            {copy(locale, "Newsletter", "Newsletter")}
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl md:text-5xl">
            {copy(
              locale,
              "Stay ahead of the curve on digital strategy, AI, and modern platforms.",
              "Fique a frente sobre estrategia digital, IA e plataformas modernas.",
            )}
          </h1>
          <p className="mt-4 text-base text-slate-300 sm:text-lg">
            {copy(
              locale,
              "Subscribers get curated executive intelligence: the market shifts worth watching, the cases worth studying, and the patterns worth adopting.",
              "Assinantes recebem inteligencia executiva curada: as mudancas de mercado que importam, os casos que valem a pena estudar e os padroes que vale a pena adotar.",
            )}
          </p>
          <ul className="mt-8 space-y-3 text-slate-300">
            <li>- {copy(locale, "Curated signals on where digital investment is moving", "Sinais curados sobre para onde caminha o investimento digital")}</li>
            <li>- {copy(locale, "Executive-ready analysis on growth and efficiency levers", "Analises prontas para lideranca sobre alavancas de crescimento e eficiencia")}</li>
            <li>- {copy(locale, "Proven execution cases that connect strategy to results", "Casos de execucao comprovados que conectam estrategia a resultados")}</li>
          </ul>
        </section>

        <NewsletterForm locale={locale} source="newsletter-page" />
      </div>
    </main>
  );
}
