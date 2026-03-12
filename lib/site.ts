export const locales = ["en", "pt"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const siteConfig = {
  name: "Michael Barbosa Santos",
  role: "Data Engineering And AI Business Insights",
  title: "Michael Barbosa Santos | Senior Data Engineer",
  description:
    "A bilingual publication on data engineering and AI focused on business problems, market signals, and the technical paths that make solutions real.",
  url: "https://michael.business",
  email: "eng.michaelbarbosa@hotmail.com",
  linkedinUrl: "https://www.linkedin.com/in/michael-bs/",
  githubUrl: "https://github.com/michael-eng-ai",
};

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function copy(locale: Locale, en: string, pt: string) {
  return locale === "pt" ? pt : en;
}

export function localePath(locale: Locale, path = "") {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${normalized === "/" ? "" : normalized}`;
}
