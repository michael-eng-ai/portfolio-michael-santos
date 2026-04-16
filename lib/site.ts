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
  name: "Michael Santos",
  role: "Data Engineering & AI",
  title: "Michael Barbosa Santos | Senior Data Engineer",
  tagline: "Growth starts with your data.",
  description:
    "Turning raw data into real-time decisions. Data pipelines, lakehouse architectures, and AI infrastructure that drive business growth.",
  url: "https://michael.business",
  location: "João Pessoa, Brazil",
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

export function resolveRequestLocale(input: {
  acceptLanguage?: string | null;
  preferredLocale?: string | null;
}) {
  if (input.preferredLocale && isLocale(input.preferredLocale)) {
    return input.preferredLocale;
  }

  const acceptLanguage = input.acceptLanguage?.toLowerCase() ?? "";

  if (acceptLanguage.includes("pt")) {
    return "pt";
  }

  if (acceptLanguage.includes("en")) {
    return "en";
  }

  return defaultLocale;
}
