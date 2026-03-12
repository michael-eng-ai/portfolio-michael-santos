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

export function clampText(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3).trimEnd()}...`;
}

export function sourceInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
