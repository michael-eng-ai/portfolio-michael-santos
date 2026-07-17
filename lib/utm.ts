import { Locale, isLocale } from "@/lib/site";

export type SocialUtmSource = "linkedin" | "x";

export type SocialUtmInput = {
  source: SocialUtmSource;
  campaign: string;
  content: string;
  medium?: string;
};

function sanitizeUtmValue(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function resolveSocialLocale(
  preferred: string | null | undefined,
  fallback: Locale = "en",
): Locale {
  if (preferred && isLocale(preferred)) {
    return preferred;
  }

  return fallback;
}

/**
 * Appends standardized social UTM params to a site URL.
 * Format: utm_source=linkedin|x&utm_medium=social&utm_campaign={slug}&utm_content={locale}
 */
export function withSocialUtm(url: string, input: SocialUtmInput): string {
  const parsed = new URL(url);
  const campaign = sanitizeUtmValue(input.campaign);
  const content = sanitizeUtmValue(input.content);

  parsed.searchParams.set("utm_source", input.source);
  parsed.searchParams.set("utm_medium", input.medium ?? "social");

  if (campaign) {
    parsed.searchParams.set("utm_campaign", campaign);
  }

  if (content) {
    parsed.searchParams.set("utm_content", content);
  }

  return parsed.toString();
}

export function buildLocalizedSiteUrl({
  host = "https://michael.business",
  locale,
  path,
  source,
  campaign,
}: {
  host?: string;
  locale: Locale;
  path: string;
  source: SocialUtmSource;
  campaign: string;
}): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const base = `${host.replace(/\/$/, "")}/${locale}${normalizedPath}`;
  return withSocialUtm(base, { source, campaign, content: locale });
}
