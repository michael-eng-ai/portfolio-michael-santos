import { buildPageMetadata } from "@/lib/seo";
import { Locale, copy, siteConfig } from "@/lib/site";

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
      "Contact Michael Barbosa Santos",
      "Contato com Michael Barbosa Santos",
    ),
    description: copy(
      locale,
      "Get in touch for consulting, technical leadership, partnerships, and growth-focused data or AI initiatives.",
      "Entre em contato para consultoria, lideranca tecnica, parcerias e iniciativas de dados ou IA focadas em crescimento.",
    ),
    path: "/contact",
    keywords: ["contact", "consulting", "data engineering advisor"],
  });
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as Locale;

  return (
    <main className="container-shell py-10 sm:py-16">
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-[1fr_0.9fr]">
        <section className="section-card rounded-[28px] p-6 sm:rounded-[32px] sm:p-8 md:p-10">
          <p className="text-xs uppercase tracking-[0.3em] text-blue-300">
            {copy(locale, "Contact", "Contato")}
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl md:text-5xl">
            {copy(
              locale,
              "Ready to create value with modern data and AI solutions.",
              "Pronto para criar valor com solucoes modernas de dados e IA.",
            )}
          </h1>
          <p className="mt-4 text-base text-slate-300 sm:text-lg">
            {copy(
              locale,
              "Reach out to discuss new opportunities, strategic consulting, technical leadership, or partnerships that drive measurable results.",
              "Entre em contato para discutir novas oportunidades, consultoria estrategica, lideranca tecnica ou parcerias que gerem resultados mensuraveis.",
            )}
          </p>
        </section>

        <section className="section-card rounded-[28px] p-6 sm:rounded-[32px] sm:p-8 md:p-10">
          <div className="space-y-5 text-slate-300">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Email</p>
              <a href={`mailto:${siteConfig.email}`} className="link-safe-break mt-2 block text-base text-white sm:text-lg">
                {siteConfig.email}
              </a>
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">GitHub</p>
              <a href={siteConfig.githubUrl} target="_blank" rel="noreferrer" className="link-safe-break mt-2 block text-base text-white sm:text-lg">
                {siteConfig.githubUrl}
              </a>
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">LinkedIn</p>
              <a href={siteConfig.linkedinUrl} target="_blank" rel="noreferrer" className="link-safe-break mt-2 block text-base text-white sm:text-lg">
                {siteConfig.linkedinUrl}
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
