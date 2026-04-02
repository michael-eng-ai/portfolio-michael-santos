import { promises as fs } from "node:fs";
import path from "node:path";

import { Locale, copy } from "@/lib/site";

export const resumeDocumentLocales = ["en", "pt"] as const;

export type ResumeDocumentLocale = (typeof resumeDocumentLocales)[number];

type ResumeDocumentConfig = {
  fileName: string;
  title: {
    en: string;
    pt: string;
  };
  audience: {
    en: string;
    pt: string;
  };
  summary: {
    en: string;
    pt: string;
  };
};

const resumeDocuments: Record<ResumeDocumentLocale, ResumeDocumentConfig> = {
  en: {
    fileName: "michael-barbosa-santos-resume-en.md",
    title: {
      en: "English Resume",
      pt: "Curriculo em Ingles",
    },
    audience: {
      en: "Best for global hiring loops, consulting conversations, and international clients.",
      pt: "Melhor para processos internacionais, conversas de consultoria e clientes globais.",
    },
    summary: {
      en: "Printable HTML view plus the original markdown export.",
      pt: "Versao HTML imprimivel mais o export original em markdown.",
    },
  },
  pt: {
    fileName: "michael-barbosa-santos-resume-pt.md",
    title: {
      en: "Portuguese Resume",
      pt: "Curriculo em Portugues",
    },
    audience: {
      en: "Best for Brazil-based hiring, local introductions, and Portuguese-speaking stakeholders.",
      pt: "Melhor para vagas no Brasil, apresentacoes locais e stakeholders lusofonos.",
    },
    summary: {
      en: "Localized HTML view with the same technical and business positioning.",
      pt: "Versao HTML localizada com o mesmo posicionamento tecnico e de negocio.",
    },
  },
};

export function isResumeDocumentLocale(value: string): value is ResumeDocumentLocale {
  return resumeDocumentLocales.includes(value as ResumeDocumentLocale);
}

export function getResumeDocumentConfig(documentLocale: ResumeDocumentLocale) {
  return resumeDocuments[documentLocale];
}

export function getResumeDownloadPath(documentLocale: ResumeDocumentLocale) {
  return `/resume/${resumeDocuments[documentLocale].fileName}`;
}

export async function getResumeMarkdown(documentLocale: ResumeDocumentLocale) {
  const { fileName } = getResumeDocumentConfig(documentLocale);

  return fs.readFile(path.join(process.cwd(), "public", "resume", fileName), "utf8");
}

export function getResumeCardCopy(
  pageLocale: Locale,
  documentLocale: ResumeDocumentLocale,
) {
  const config = getResumeDocumentConfig(documentLocale);

  return {
    title: copy(pageLocale, config.title.en, config.title.pt),
    audience: copy(pageLocale, config.audience.en, config.audience.pt),
    summary: copy(pageLocale, config.summary.en, config.summary.pt),
  };
}
