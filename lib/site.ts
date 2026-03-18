export const locales = ["en", "pt"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeMetadata = {
  en: {
    bcp47: "en-US",
    openGraph: "en_US",
    label: "English",
  },
  pt: {
    bcp47: "pt-BR",
    openGraph: "pt_BR",
    label: "Portuguese",
  },
} as const;

export const siteConfig = {
  name: "Michael Barbosa Santos",
  role: "Data Engineering And AI Business Insights",
  title: "Michael Barbosa Santos | Senior Data Engineer",
  description:
    "A bilingual publication on data engineering and AI focused on business problems, market signals, and the technical paths that make solutions real.",
  url: "https://michael.business",
  location: "Fortaleza, Brazil",
  email: "eng.michaelbarbosa@hotmail.com",
  linkedinUrl: "https://www.linkedin.com/in/michael-bs/",
  githubUrl: "https://github.com/michael-eng-ai",
  defaultSocialImage: "/opengraph-image",
  keywords: [
    "data engineering",
    "artificial intelligence",
    "AI strategy",
    "modern data platform",
    "business intelligence",
    "digital strategy",
    "data architecture",
    "machine learning operations",
    "portfolio",
    "data engineer portfolio",
    "lakehouse architecture",
    "dbt",
    "databricks",
    "snowflake",
    "apache spark",
    "data pipeline",
    "MLOps",
    "real-time analytics",
    "CDC pipeline",
    "engenharia de dados",
    "inteligencia artificial",
    "plataforma de dados",
    "arquitetura de dados",
    "estrategia digital",
  ],
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
