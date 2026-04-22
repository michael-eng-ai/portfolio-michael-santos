import type { Metadata } from "next";

import { Locale, localeMetadata, localePath, locales, siteConfig } from "@/lib/site";

type BuildPageMetadataInput = {
  locale: Locale;
  title: string;
  description: string;
  path?: string;
  imageUrl?: string;
  keywords?: string[];
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
};

type StructuredDataRecord = Record<string, unknown>;

function ensureLeadingSlash(path = "") {
  if (!path) {
    return "";
  }

  return path.startsWith("/") ? path : `/${path}`;
}

export function absoluteUrl(path = "") {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return new URL(ensureLeadingSlash(path), siteConfig.url).toString();
}

export function localizedUrl(locale: Locale, path = "") {
  return absoluteUrl(localePath(locale, path));
}

export function buildLanguageAlternates(path = "") {
  const alternates = Object.fromEntries(
    locales.map((locale) => [localeMetadata[locale].bcp47, localizedUrl(locale, path)]),
  );

  return {
    ...alternates,
    "x-default": localizedUrl("en", path),
  };
}

export function buildPageMetadata({
  locale,
  title,
  description,
  path = "",
  imageUrl = siteConfig.defaultSocialImage,
  keywords = [],
  type = "website",
  publishedTime,
  modifiedTime,
}: BuildPageMetadataInput): Metadata {
  const url = localizedUrl(locale, path);
  const image = absoluteUrl(imageUrl);

  return {
    title,
    description,
    keywords: [...siteConfig.keywords, ...keywords],
    alternates: {
      canonical: url,
      languages: buildLanguageAlternates(path),
    },
    authors: [{ name: siteConfig.name, url: siteConfig.linkedinUrl }],
    creator: siteConfig.name,
    publisher: siteConfig.name,
    openGraph: {
      type,
      url,
      title,
      description,
      siteName: siteConfig.name,
      locale: localeMetadata[locale].openGraph,
      alternateLocale: locales
        .filter((value) => value !== locale)
        .map((value) => localeMetadata[value].openGraph),
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export function buildPersonJsonLd(): StructuredDataRecord {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: siteConfig.name,
    url: siteConfig.url,
    jobTitle: siteConfig.role,
    email: siteConfig.email,
    homeLocation: {
      "@type": "Place",
      name: siteConfig.location,
    },
    sameAs: [siteConfig.linkedinUrl, siteConfig.githubUrl],
    knowsAbout: siteConfig.keywords,
  };
}

export function buildWebsiteJsonLd(locale: Locale): StructuredDataRecord {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.title,
    description: siteConfig.description,
    url: localizedUrl(locale),
    inLanguage: localeMetadata[locale].bcp47,
    publisher: {
      "@type": "Person",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: `${localizedUrl(locale, "/articles")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildOrganizationJsonLd(): StructuredDataRecord {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: absoluteUrl(siteConfig.defaultSocialImage),
    email: siteConfig.email,
    founder: {
      "@type": "Person",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    sameAs: [siteConfig.linkedinUrl, siteConfig.githubUrl],
  };
}

export function buildItemListJsonLd({
  locale,
  name,
  description,
  path,
  items,
}: {
  locale: Locale;
  name: string;
  description: string;
  path: string;
  items: { name: string; path: string; description?: string; image?: string }[];
}): StructuredDataRecord {
  const url = localizedUrl(locale, path);

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url,
    inLanguage: localeMetadata[locale].bcp47,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: items.length,
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: localizedUrl(locale, item.path),
        name: item.name,
        ...(item.description ? { description: item.description } : {}),
        ...(item.image ? { image: absoluteUrl(item.image) } : {}),
      })),
    },
  };
}

export function buildArticleJsonLd({
  locale,
  title,
  description,
  path,
  imageUrl,
  publishedAt,
  keywords = [],
  type = "Article",
}: {
  locale: Locale;
  title: string;
  description: string;
  path: string;
  imageUrl?: string;
  publishedAt: string;
  keywords?: string[];
  type?: "Article" | "NewsArticle";
}): StructuredDataRecord {
  const url = localizedUrl(locale, path);

  return {
    "@context": "https://schema.org",
    "@type": type,
    headline: title,
    description,
    datePublished: publishedAt,
    dateModified: publishedAt,
    inLanguage: localeMetadata[locale].bcp47,
    mainEntityOfPage: url,
    url,
    image: absoluteUrl(imageUrl ?? siteConfig.defaultSocialImage),
    author: {
      "@type": "Person",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    publisher: {
      "@type": "Person",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    keywords,
  };
}

export function buildBreadcrumbJsonLd(
  locale: Locale,
  items: { name: string; path?: string }[],
): StructuredDataRecord {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.path ? { item: localizedUrl(locale, item.path) } : {}),
    })),
  };
}

export function buildFaqJsonLd(
  items: { question: string; answer: string }[],
): StructuredDataRecord {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function buildProjectJsonLd({
  locale,
  title,
  description,
  path,
  imageUrl,
  repoUrl,
  keywords = [],
}: {
  locale: Locale;
  title: string;
  description: string;
  path: string;
  imageUrl?: string;
  repoUrl: string;
  keywords?: string[];
}): StructuredDataRecord {
  const url = localizedUrl(locale, path);

  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: title,
    description,
    url,
    image: absoluteUrl(imageUrl ?? siteConfig.defaultSocialImage),
    inLanguage: localeMetadata[locale].bcp47,
    author: {
      "@type": "Person",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    creator: {
      "@type": "Person",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    isBasedOn: repoUrl,
    keywords,
  };
}
