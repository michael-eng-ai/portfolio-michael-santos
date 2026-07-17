import { Locale } from "@/lib/site";
import {
  buildLinkedinHook,
  firstSentence,
  type LinkedinDraftSourceType,
} from "@/lib/linkedin-draft-copy";

export type XDraftSourceType = LinkedinDraftSourceType;

function normalizeComparable(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\u00c0-\u024f]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * X hook must create tension and must not equal the SEO title.
 */
export function buildXHook({
  locale,
  sourceType,
  title,
  excerpt,
}: {
  locale: Locale;
  sourceType: XDraftSourceType;
  title: string;
  excerpt: string;
}): string {
  return buildLinkedinHook({ locale, sourceType, title, excerpt });
}

export function buildXThreadPosts({
  locale,
  sourceType,
  title,
  excerpt,
  hasProof,
}: {
  locale: Locale;
  sourceType: XDraftSourceType;
  title: string;
  excerpt: string;
  hasProof: boolean;
}): string[] {
  const hook = buildXHook({ locale, sourceType, title, excerpt });
  const detail = firstSentence(excerpt) || excerpt.replace(/\s+/g, " ").trim();
  const detailNorm = normalizeComparable(detail);
  const hookNorm = normalizeComparable(hook);

  const second =
    detail && detailNorm !== hookNorm
      ? detail
      : locale === "pt"
        ? sourceType === "project"
          ? "O case mostra as escolhas de arquitetura sob pressao real de entrega."
          : "O breakdown no site conecta o incidente ao padrao de implementacao."
        : sourceType === "project"
          ? "The case shows architecture choices under real delivery pressure."
          : "The site breakdown connects the incident to the implementation pattern.";

  const cta =
    locale === "pt"
      ? hasProof
        ? "Thread completa no site + prova no GitHub:"
        : "Leia o breakdown completo:"
      : hasProof
        ? "Full thread on the site + proof on GitHub:"
        : "Read the full breakdown:";

  return [hook, second, cta];
}
