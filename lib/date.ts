import type { Locale } from "@/lib/site";

const localeMap: Record<Locale, string> = {
  en: "en-US",
  pt: "pt-BR",
};

export function formatDisplayDate(value: string, locale: Locale) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(localeMap[locale], {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(parsed);
}
