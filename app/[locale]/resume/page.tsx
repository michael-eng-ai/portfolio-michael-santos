import { TrackedExternalLink } from "@/components/tracked-external-link";
import { TrackedLink } from "@/components/tracked-link";
import {
  getResumeCardCopy,
  getResumeDownloadPath,
  resumeDocumentLocales,
} from "@/lib/resume";
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
      "Resume Formats",
      "Formatos de Curriculo",
    ),
    description: copy(
      locale,
      "Choose between printable HTML resume views and markdown downloads in English or Portuguese.",
      "Escolha entre versoes HTML imprimiveis e downloads em markdown do curriculo em ingles ou portugues.",
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
    <main className="px-6 pb-20 pt-28 md:px-20">
      <div className="mx-auto max-w-6xl rounded-[32px] border border-black/10 bg-white p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)] sm:p-8 md:p-10">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--primary)]">
          {copy(locale, "Resume", "Curriculo")}
        </p>
        <h1 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl md:text-5xl">
          {copy(locale, "Choose the best resume format for the conversation", "Escolha o melhor formato de curriculo para a conversa")}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-gray-600 sm:text-lg">
          {copy(
            locale,
            "Open a recruiter-friendly HTML version, print it to PDF when needed, or keep the original markdown export. The positioning stays aligned with the site, GitHub, and LinkedIn.",
            "Abra uma versao HTML amigavel para recrutadores, imprima em PDF quando precisar ou mantenha o export original em markdown. O posicionamento continua alinhado com o site, GitHub e LinkedIn.",
          )}
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {resumeDocumentLocales.map((documentLocale) => {
            const content = getResumeCardCopy(locale, documentLocale);
            const markdownPath = getResumeDownloadPath(documentLocale);

            return (
              <section
                key={documentLocale}
                className="rounded-[28px] border border-black/10 bg-[linear-gradient(180deg,rgba(248,250,252,0.96),rgba(255,255,255,1))] p-6 shadow-[0_16px_48px_rgba(15,23,42,0.06)]"
              >
                <p className="text-xs font-black uppercase tracking-[0.28em] text-gray-400">
                  {documentLocale.toUpperCase()}
                </p>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-gray-900">
                  {content.title}
                </h2>
                <p className="mt-4 text-sm leading-7 text-gray-600 sm:text-base">
                  {content.audience}
                </p>
                <p className="mt-3 text-xs uppercase tracking-[0.18em] text-gray-400">
                  {content.summary}
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <TrackedLink
                    href={`/${locale}/resume/${documentLocale}`}
                    eventName="resume_view_click"
                    eventParams={{ locale, document_locale: documentLocale, source: "resume_hub" }}
                    className="brand-button-primary rounded-full px-5 py-3 text-sm font-medium"
                  >
                    {copy(locale, "Open HTML version", "Abrir versao HTML")}
                  </TrackedLink>
                  <TrackedExternalLink
                    href={markdownPath}
                    download
                    eventName="resume_download"
                    eventParams={{ locale, file: `${documentLocale}-markdown`, source: "resume_hub" }}
                    className="brand-button-secondary rounded-full px-5 py-3 text-sm font-medium"
                  >
                    {copy(locale, "Download markdown", "Baixar markdown")}
                  </TrackedExternalLink>
                </div>
              </section>
            );
          })}
        </div>

        <div className="mt-10 grid gap-4 rounded-[28px] border border-dashed border-black/10 bg-[var(--surface)] p-6 md:grid-cols-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-gray-400">
              {copy(locale, "Best default", "Melhor padrao")}
            </p>
            <p className="mt-3 text-sm leading-6 text-gray-700">
              {copy(
                locale,
                "Use the HTML version when sending the resume link directly. It reads better on mobile and desktop.",
                "Use a versao HTML ao enviar o link direto do curriculo. Ela le melhor no mobile e no desktop.",
              )}
            </p>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-gray-400">
              {copy(locale, "PDF path", "Caminho para PDF")}
            </p>
            <p className="mt-3 text-sm leading-6 text-gray-700">
              {copy(
                locale,
                "Inside the HTML version, use Print or Save as PDF for a cleaner export than raw markdown.",
                "Dentro da versao HTML, use Imprimir ou Salvar em PDF para um export mais limpo do que markdown cru.",
              )}
            </p>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-gray-400">
              {copy(locale, "Backup source", "Fonte de backup")}
            </p>
            <p className="mt-3 text-sm leading-6 text-gray-700">
              {copy(
                locale,
                "Markdown remains available as the portable source of truth and a fallback attachment format.",
                "O markdown continua disponivel como fonte portavel da verdade e formato de anexo de fallback.",
              )}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
