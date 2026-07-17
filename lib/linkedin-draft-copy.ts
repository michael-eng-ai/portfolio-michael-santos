import { Locale } from "@/lib/site";

export type LinkedinDraftSourceType = "article" | "project";

function normalizeComparable(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\u00c0-\u024f]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function firstSentence(text: string): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) {
    return "";
  }

  const match = cleaned.match(/^(.+?[.!?])(\s|$)/);
  return (match?.[1] ?? cleaned).trim();
}

function looksLikeHeadline(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) {
    return true;
  }

  // Headlines often use a colon and omit sentence punctuation.
  if (/:/.test(trimmed) && !/[.!?]$/.test(trimmed)) {
    return true;
  }

  // Very short fragments without verbs tend to be titles, not pressure statements.
  return trimmed.length < 40 && !/[.!?]$/.test(trimmed);
}

function topicFromTitle(title: string): string {
  const primary = title.split(":")[0]?.trim() || title.trim();
  return primary.replace(/\s+/g, " ").trim();
}

/**
 * LinkedIn hook: business pressure / market insight — never a raw title copy.
 * Aligns with CONTENT_CHANNEL_SYSTEM.md (pressure → response → proof → CTA).
 */
export function buildLinkedinHook({
  locale,
  sourceType,
  title,
  excerpt,
}: {
  locale: Locale;
  sourceType: LinkedinDraftSourceType;
  title: string;
  excerpt: string;
}): string {
  const insight = firstSentence(excerpt);
  const titleNorm = normalizeComparable(title);
  const insightNorm = normalizeComparable(insight);

  if (
    insight &&
    insightNorm !== titleNorm &&
    !looksLikeHeadline(insight) &&
    !insightNorm.startsWith(titleNorm)
  ) {
    return insight;
  }

  const topic = topicFromTitle(title);

  if (locale === "pt") {
    return sourceType === "project"
      ? `${topic} só importa se aguentar pressão real de entrega.`
      : `A pressão de negócio por trás de ${topic} está acelerando mais rápido do que a maioria dos stacks de dados consegue absorver.`;
  }

  return sourceType === "project"
    ? `${topic} only matters if it survives real delivery pressure.`
    : `The business pressure behind ${topic} is accelerating faster than most data stacks can absorb.`;
}

/**
 * Body: technical/response insight from the excerpt plus optional proof cue.
 */
export function buildLinkedinBody({
  locale,
  excerpt,
  hasProof,
}: {
  locale: Locale;
  excerpt: string;
  hasProof: boolean;
}): string {
  const core = excerpt.replace(/\s+/g, " ").trim();

  if (!hasProof) {
    return core;
  }

  const proofLine =
    locale === "pt"
      ? "A prova operacional está no repositório GitHub referenciado neste post."
      : "Operational proof is in the GitHub repository referenced in this post.";

  return `${core}\n\n${proofLine}`;
}

/**
 * CTA: one specific next step (article case or project case) — not a generic blurb.
 */
export function buildLinkedinCta({
  locale,
  sourceType,
  hasProof,
}: {
  locale: Locale;
  sourceType: LinkedinDraftSourceType;
  hasProof: boolean;
}): string {
  if (locale === "pt") {
    if (sourceType === "article") {
      return hasProof
        ? "Leia o artigo completo no site e abra o GitHub como prova operacional."
        : "Leia o artigo completo no site para o breakdown completo.";
    }

    return hasProof
      ? "Abra o case do projeto no site e inspecione a implementação no GitHub."
      : "Abra o case do projeto no site para os detalhes de entrega.";
  }

  if (sourceType === "article") {
    return hasProof
      ? "Read the full article on the site, then open GitHub for operational proof."
      : "Read the full article on the site for the complete breakdown.";
  }

  return hasProof
    ? "Open the project case on the site and inspect the GitHub implementation."
    : "Open the project case on the site for the delivery details.";
}

export function buildLinkedinLocaleCopy({
  locale,
  sourceType,
  title,
  excerpt,
  hasProof,
}: {
  locale: Locale;
  sourceType: LinkedinDraftSourceType;
  title: string;
  excerpt: string;
  hasProof: boolean;
}) {
  return {
    hook: buildLinkedinHook({ locale, sourceType, title, excerpt }),
    body: buildLinkedinBody({ locale, excerpt, hasProof }),
    cta: buildLinkedinCta({ locale, sourceType, hasProof }),
  };
}
