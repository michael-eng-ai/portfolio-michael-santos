import { type Article, type NewsReference, type Project } from "@/lib/content";

type RecommendationType = "article" | "project" | "news";
type RecommendationMatchKind = "direct" | "direct_and_tags" | "tags" | "fallback";

type RecommendationSource =
  | { type: "article"; item: Article }
  | { type: "project"; item: Project }
  | { type: "news"; item: NewsReference };

type RecommendationCandidate =
  | { type: "article"; item: Article }
  | { type: "project"; item: Project }
  | { type: "news"; item: NewsReference };

type RecommendationDraft = {
  type: RecommendationType;
  slug: string;
  directRelation: boolean;
  sharedTags: string[];
  primaryScore: number;
  fallbackScore: number;
  score: number;
  matchKind: RecommendationMatchKind;
};

export type TopicClusterRecommendation =
  | (RecommendationDraft & { type: "article"; item: Article })
  | (RecommendationDraft & { type: "project"; item: Project })
  | (RecommendationDraft & { type: "news"; item: NewsReference });

const DAY_IN_MS = 1000 * 60 * 60 * 24;

function getFreshnessBoost(
  publishedAt: string | undefined,
  maxWindowDays: number,
  maxScore: number,
) {
  if (!publishedAt) {
    return 0;
  }

  const publishedAtMs = Date.parse(publishedAt);

  if (Number.isNaN(publishedAtMs)) {
    return 0;
  }

  const ageInDays = Math.max(0, Math.floor((Date.now() - publishedAtMs) / DAY_IN_MS));

  if (ageInDays >= maxWindowDays) {
    return 0;
  }

  return Math.round((1 - ageInDays / maxWindowDays) * maxScore * 10) / 10;
}

function getSharedTags(sourceTags: string[], candidateTags: string[]) {
  const sourceTagSet = new Set(sourceTags);

  return candidateTags.filter((tag, index) => sourceTagSet.has(tag) && candidateTags.indexOf(tag) === index);
}

function hasDirectRelation(
  source: RecommendationSource,
  candidate: RecommendationCandidate,
) {
  if (source.type === "article" && candidate.type === "project") {
    return (
      source.item.relatedProjectSlugs.includes(candidate.item.slug) ||
      candidate.item.relatedArticleSlugs.includes(source.item.slug)
    );
  }

  if (source.type === "article" && candidate.type === "news") {
    return source.item.relatedNewsSlugs.includes(candidate.item.slug);
  }

  if (source.type === "project" && candidate.type === "article") {
    return (
      source.item.relatedArticleSlugs.includes(candidate.item.slug) ||
      candidate.item.relatedProjectSlugs.includes(source.item.slug)
    );
  }

  if (source.type === "project" && candidate.type === "news") {
    return (
      source.item.relatedNewsSlugs.includes(candidate.item.slug) ||
      candidate.item.relatedProjectSlugs.includes(source.item.slug)
    );
  }

  if (source.type === "news" && candidate.type === "project") {
    return (
      source.item.relatedProjectSlugs.includes(candidate.item.slug) ||
      candidate.item.relatedNewsSlugs.includes(source.item.slug)
    );
  }

  if (source.type === "news" && candidate.type === "article") {
    return candidate.item.relatedNewsSlugs.includes(source.item.slug);
  }

  return false;
}

function getFallbackScore(candidate: RecommendationCandidate) {
  if (candidate.type === "project") {
    return candidate.item.featured ? 12 : 4;
  }

  if (candidate.type === "article") {
    return (candidate.item.featured ? 8 : 0) + getFreshnessBoost(candidate.item.publishedAt, 180, 6);
  }

  return getFreshnessBoost(candidate.item.publishedAt, 45, 10);
}

function buildDraft(
  source: RecommendationSource,
  candidate: RecommendationCandidate,
): TopicClusterRecommendation {
  const sharedTags = getSharedTags(source.item.tags, candidate.item.tags);
  const directRelation = hasDirectRelation(source, candidate);
  const primaryScore = (directRelation ? 100 : 0) + sharedTags.length * 18;
  const fallbackScore = getFallbackScore(candidate);
  const matchKind: RecommendationMatchKind = directRelation
    ? sharedTags.length > 0
      ? "direct_and_tags"
      : "direct"
    : sharedTags.length > 0
      ? "tags"
      : "fallback";

  return {
    ...candidate,
    slug: candidate.item.slug,
    directRelation,
    sharedTags,
    primaryScore,
    fallbackScore,
    score: primaryScore > 0 ? primaryScore : fallbackScore,
    matchKind,
  };
}

function sortRecommendations(
  left: TopicClusterRecommendation,
  right: TopicClusterRecommendation,
) {
  return right.score - left.score || left.slug.localeCompare(right.slug);
}

function selectDiversifiedRecommendations(
  candidates: TopicClusterRecommendation[],
  limit: number,
) {
  const selected: TopicClusterRecommendation[] = [];
  const seen = new Set<string>();
  const topByType = new Map<RecommendationType, TopicClusterRecommendation>();

  for (const candidate of [...candidates].sort(sortRecommendations)) {
    if (!topByType.has(candidate.type)) {
      topByType.set(candidate.type, candidate);
    }
  }

  for (const candidate of [...topByType.values()].sort(sortRecommendations)) {
    const key = `${candidate.type}:${candidate.slug}`;

    if (selected.length >= limit || seen.has(key)) {
      continue;
    }

    selected.push(candidate);
    seen.add(key);
  }

  for (const candidate of [...candidates].sort(sortRecommendations)) {
    const key = `${candidate.type}:${candidate.slug}`;

    if (selected.length >= limit || seen.has(key)) {
      continue;
    }

    selected.push(candidate);
    seen.add(key);
  }

  return selected;
}

export function getTopicClusterRecommendations({
  source,
  articles = [],
  projects = [],
  news = [],
  limit = 3,
}: {
  source: RecommendationSource;
  articles?: Article[];
  projects?: Project[];
  news?: NewsReference[];
  limit?: number;
}) {
  const candidates: TopicClusterRecommendation[] = [];

  if (source.type !== "article") {
    candidates.push(...articles.map((item) => buildDraft(source, { type: "article", item })));
  }

  if (source.type !== "project") {
    candidates.push(...projects.map((item) => buildDraft(source, { type: "project", item })));
  }

  if (source.type !== "news") {
    candidates.push(...news.map((item) => buildDraft(source, { type: "news", item })));
  }

  const primaryMatches = candidates.filter(
    (candidate) => candidate.directRelation || candidate.sharedTags.length > 0,
  );
  const primarySelection = selectDiversifiedRecommendations(primaryMatches, limit);

  if (primarySelection.length >= limit) {
    return primarySelection;
  }

  const selectedKeys = new Set(primarySelection.map((candidate) => `${candidate.type}:${candidate.slug}`));
  const fallbackMatches = candidates.filter(
    (candidate) =>
      !selectedKeys.has(`${candidate.type}:${candidate.slug}`) && candidate.fallbackScore > 0,
  );

  return [
    ...primarySelection,
    ...selectDiversifiedRecommendations(fallbackMatches, limit - primarySelection.length),
  ].slice(0, limit);
}
