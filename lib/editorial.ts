export const editorialLimits = {
  heroTitleMax: 72,
  heroSummaryMax: 180,
  cardTitleMax: 90,
  cardSummaryMax: 180,
  cardContextMax: 150,
  articleExcerptMax: 220,
  newsSummaryMax: 220,
  whyItMattersMax: 180,
} as const;

export const metaDescriptionLimits = {
  min: 40,
  max: 200,
} as const;

function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

/** Cut on the last whitespace that still leaves a readable fragment. */
export function truncateAtWord(value: string, maxLength: number) {
  const normalized = collapseWhitespace(value);

  if (normalized.length <= maxLength) {
    return normalized;
  }

  const slice = normalized.slice(0, maxLength);
  const lastSpace = slice.lastIndexOf(" ");
  const minimum = Math.min(24, Math.floor(maxLength * 0.5));

  if (lastSpace >= minimum) {
    return slice.slice(0, lastSpace).trimEnd();
  }

  return slice.trimEnd();
}

export function clampText(value: string, maxLength: number) {
  const normalized = collapseWhitespace(value);

  if (normalized.length <= maxLength) {
    return normalized;
  }

  const budget = Math.max(1, maxLength - 3);
  return `${truncateAtWord(normalized, budget)}...`;
}

/**
 * Social titles that were hard-sliced already end in `...`. Drop the ellipsis
 * and the partial last token so the tag does not stop mid-word.
 */
export function toSocialTitle(value: string) {
  let text = collapseWhitespace(value);

  if (/(?:\.{3}|…)\s*$/.test(text)) {
    text = text.replace(/(?:\.{3}|…)\s*$/, "").trimEnd();
    text = text.replace(/\s+\S+$/, "").trimEnd();
  }

  return text;
}

/**
 * Open Graph / Twitter descriptions should finish on a sentence, or at least
 * a word, inside ~155–200 characters. Stored news blurbs were sliced mid-word
 * and then suffixed with `...`.
 */
export function toMetaDescription(value: string, maxLength = metaDescriptionLimits.max) {
  let text = collapseWhitespace(value);

  if (/(?:\.{3}|…)\s*$/.test(text)) {
    text = text.replace(/(?:\.{3}|…)\s*$/, "").trimEnd();
    text = text.replace(/\s+\S+$/, "").trimEnd();
  }

  if (!text) {
    return text;
  }

  const endsSentence = /[.!?]["')\]]*$/.test(text);
  if (text.length <= maxLength && endsSentence) {
    return text;
  }

  const window = text.slice(0, Math.min(text.length, maxLength));
  const sentenceEnds = [...window.matchAll(/[.!?]["')\]]*(?=\s|$)/g)]
    .map((match) => (match.index ?? 0) + match[0].length)
    .filter((end) => end >= metaDescriptionLimits.min && end <= maxLength);
  const sentenceEnd = sentenceEnds.at(-1);

  if (sentenceEnd) {
    return text.slice(0, sentenceEnd).trim();
  }

  if (text.length <= maxLength) {
    return text;
  }

  const lastSpace = window.lastIndexOf(" ");
  if (lastSpace >= metaDescriptionLimits.min) {
    return window.slice(0, lastSpace).trimEnd();
  }

  return window.trimEnd();
}

export function sourceInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
