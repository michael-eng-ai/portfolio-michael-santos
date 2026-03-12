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
      "Bilingual Resume Download",
      "Download do Curriculo Bilingue",
    ),
    description: copy(
      locale,
      "Download English and Portuguese resume versions aligned with the site's business and technical positioning.",
      "Baixe as versoes em ingles e portugues do curriculo alinhadas ao posicionamento tecnico e de negocio do site.",
    ),
    path: "/resume",
    keywords: ["resume", "CV", "Senior Data Engineer resume"],
  });
}

export default async function ResumePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as Locale;

  return (
    <main className="container-shell py-10 sm:py-16">
      <div className="section-card rounded-[28px] p-6 sm:rounded-[32px] sm:p-8 md:p-10">
        <p className="text-xs uppercase tracking-[0.3em] text-blue-300">
          {copy(locale, "Resume", "Curriculo")}
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl md:text-5xl">
          {copy(locale, "Download the bilingual resume set", "Baixe o conjunto bilingue de curriculos")}
        </h1>
        <p className="mt-4 max-w-3xl text-base text-slate-300 sm:text-lg">
          {copy(
            locale,
            "The resume files are aligned with the same positioning used on GitHub, the site, and LinkedIn.",
            "Os arquivos de curriculo estao alinhados com o mesmo posicionamento usado no GitHub, no site e no LinkedIn.",
          )}
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <a
            href="/resume/michael-barbosa-santos-resume-en.md"
            download
            className="brand-button-primary rounded-full px-5 py-3 font-medium"
          >
            Resume EN
          </a>
          <a
            href="/resume/michael-barbosa-santos-resume-pt.md"
            download
            className="brand-button-secondary rounded-full px-5 py-3 font-medium"
          >
            Curriculo PT
          </a>
        </div>
      </div>
    </main>
  );
}
