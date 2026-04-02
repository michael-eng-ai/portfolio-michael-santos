import { notFound } from "next/navigation";

import { MarkdownContent } from "@/components/markdown-content";
import { PrintResumeButton } from "@/components/print-resume-button";
import { StructuredData } from "@/components/structured-data";
import { TrackedExternalLink } from "@/components/tracked-external-link";
import { TrackedLink } from "@/components/tracked-link";
import {
  getResumeCardCopy,
  getResumeDownloadPath,
  getResumeMarkdown,
  isResumeDocumentLocale,
  resumeDocumentLocales,
} from "@/lib/resume";
import {
  buildBreadcrumbJsonLd,
  buildPageMetadata,
} from "@/lib/seo";
import { copy, isLocale, Locale, localePath } from "@/lib/site";

export async function generateStaticParams() {
  return resumeDocumentLocales.flatMap((document) => (
    [
      { locale: "en", document },
      { locale: "pt", document },
    ]
  ));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; document: string }>;
}) {
  const { locale: rawLocale, document } = await params;

  if (!isLocale(rawLocale) || !isResumeDocumentLocale(document)) {
    return {};
  }

  const locale = rawLocale as Locale;
  const content = getResumeCardCopy(locale, document);

  return buildPageMetadata({
    locale,
    title: copy(
      locale,
      `${content.title} | Michael Santos`,
      `${content.title} | Michael Santos`,
    ),
    description: copy(
      locale,
      "Printable HTML resume view with a clean reading experience for recruiters and clients.",
      "Versao HTML imprimivel do curriculo com leitura mais limpa para recrutadores e clientes.",
    ),
    path: `/resume/${document}`,
    keywords: ["resume", "CV", "data engineer", document],
  });
}

export default async function ResumeDocumentPage({
  params,
}: {
  params: Promise<{ locale: string; document: string }>;
}) {
  const { locale: rawLocale, document } = await params;

  if (!isLocale(rawLocale) || !isResumeDocumentLocale(document)) {
    notFound();
  }

  const locale = rawLocale as Locale;
  const documentLocale = document;
  const content = getResumeCardCopy(locale, documentLocale);
  const markdown = await getResumeMarkdown(documentLocale);
  const downloadPath = getResumeDownloadPath(documentLocale);

  return (
    <main className="px-6 pb-20 pt-28 md:px-20">
      <StructuredData
        data={[
          buildBreadcrumbJsonLd(locale, [
            { name: "Home", path: "/" },
            { name: copy(locale, "Resume", "Curriculo"), path: "/resume" },
            { name: content.title },
          ]),
        ]}
      />

      <div className="mx-auto max-w-5xl">
        <section className="resume-toolbar print-hidden rounded-3xl border border-black/10 bg-white/95 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--primary)]">
                {copy(locale, "Printable Resume", "Curriculo Imprimivel")}
              </p>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                {content.title}
              </h1>
              <p className="mt-4 text-base leading-7 text-gray-600 sm:text-lg">
                {content.audience}
              </p>
              <p className="mt-3 text-sm uppercase tracking-[0.18em] text-gray-400">
                {content.summary}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <TrackedLink
                href={localePath(locale, "/resume")}
                eventName="navigation_click"
                eventParams={{ location: "resume_document", target: "resume_hub", locale, document_locale: documentLocale }}
                className="brand-button-secondary rounded-full px-5 py-3 text-sm font-medium"
              >
                {copy(locale, "Back to resume hub", "Voltar para central de curriculos")}
              </TrackedLink>
              <PrintResumeButton
                locale={locale}
                documentLocale={documentLocale}
                className="brand-button-primary rounded-full px-5 py-3 text-sm font-medium"
              >
                {copy(locale, "Print or save as PDF", "Imprimir ou salvar em PDF")}
              </PrintResumeButton>
              <TrackedExternalLink
                href={downloadPath}
                download
                eventName="resume_download"
                eventParams={{ locale, file: `${documentLocale}-markdown`, source: "resume_document" }}
                className="brand-button-secondary rounded-full px-5 py-3 text-sm font-medium"
              >
                {copy(locale, "Download markdown", "Baixar markdown")}
              </TrackedExternalLink>
            </div>
          </div>
        </section>

        <article className="resume-sheet mt-8 rounded-[28px] border border-black/10 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-10 md:p-14">
          <div className="resume-sheet__accent" aria-hidden="true" />
          <div className="grid gap-8 border-b border-black/10 pb-8 sm:grid-cols-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-gray-400">
                {copy(locale, "Focus", "Foco")}
              </p>
              <p className="mt-3 text-sm leading-6 text-gray-700">
                {copy(
                  locale,
                  "Senior data engineering across lakehouse, analytics engineering, and real-time delivery.",
                  "Engenharia de dados senior em lakehouse, analytics engineering e entrega em tempo real.",
                )}
              </p>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-gray-400">
                {copy(locale, "Cloud span", "Cobertura cloud")}
              </p>
              <p className="mt-3 text-sm leading-6 text-gray-700">
                AWS, Azure, GCP, dbt, Spark, Terraform, Kafka
              </p>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-gray-400">
                {copy(locale, "Best use", "Melhor uso")}
              </p>
              <p className="mt-3 text-sm leading-6 text-gray-700">
                {content.audience}
              </p>
            </div>
          </div>

          <div className="mt-8">
            <MarkdownContent content={markdown} />
          </div>
        </article>
      </div>
    </main>
  );
}
