type ImageResolveInput = {
  slug: string;
  imageUrl?: string | null;
  tags?: string[];
  category?: { en?: string; pt?: string } | null;
  sourceName?: string;
  relatedProjectSlugs?: string[];
  stack?: string[];
};

const PROJECT_IMAGE_BY_SLUG: Record<string, string> = {
  "kafka-debezium-dbt": "/images/projects/cdc-analytics-case.svg",
  "aws-databricks-lakehouse": "/images/projects/lakehouse-platform-case.svg",
  "gcp-dbt-modern-data-stack": "/images/projects/gcp-modern-stack-case.svg",
  "streaming-kafka-fastapi": "/images/projects/streaming-api-case.svg",
  "ai-data-analyst-bot": "/images/projects/ai-analytics-agent-case.svg",
  "azure-snowflake-pipeline": "/images/projects/snowflake-governance-case.svg",
};

const ARTICLE_IMAGE_BY_SLUG: Record<string, string> = {
  "data-platform-modernization-patterns": "/images/articles/platform-modernization-patterns.svg",
  "from-news-to-data-product": "/images/articles/from-news-to-data-product.svg",
  "real-time-data-architectures-in-2026-streaming-and-cdc-for-trustworthy-operational-analytics":
    "/images/articles/real-time-architectures.svg",
  "governed-ai-analytics": "/images/articles/governed-ai-analytics.svg",
  "navigating-the-agentic-ai-revolution-strategic-insights-for-data-engineers-in-2026":
    "/images/articles/agentic-ai-platforms.svg",
};

const NEWS_IMAGE_BY_SLUG: Record<string, string> = {
  "linkedin-api-community-management": "/images/news/community-automation-signal.svg",
  "dbt-fusion-engine-2026": "/images/news/transformation-signal.svg",
  "snowflake-open-lakehouse-2026": "/images/news/analytics-platform-signal.svg",
  "streaming-governance-2026": "/images/news/streaming-signal.svg",
  "databricks-lakeflow-2026": "/images/news/lakehouse-signal.svg",
};

function buildHaystack(input: ImageResolveInput) {
  return [
    input.slug,
    input.sourceName,
    input.category?.en,
    input.category?.pt,
    ...(input.tags ?? []),
    ...(input.relatedProjectSlugs ?? []),
    ...(input.stack ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function pickByRules(
  haystack: string,
  rules: Array<{ keywords: string[]; imageUrl: string }>,
  fallbackImage: string,
) {
  const match = rules.find((rule) => rule.keywords.some((keyword) => haystack.includes(keyword)));
  return match?.imageUrl ?? fallbackImage;
}

export function isStockEditorialImage(imageUrl?: string | null) {
  if (!imageUrl) {
    return true;
  }

  return imageUrl.includes("images.unsplash.com");
}

export function resolveProjectImage(input: ImageResolveInput) {
  if (!isStockEditorialImage(input.imageUrl)) {
    return input.imageUrl ?? undefined;
  }

  const haystack = buildHaystack(input);

  return PROJECT_IMAGE_BY_SLUG[input.slug]
    ?? pickByRules(haystack, [
      {
        keywords: ["streaming", "kafka", "cdc", "real-time", "realtime"],
        imageUrl: "/images/projects/cdc-analytics-case.svg",
      },
      {
        keywords: ["lakehouse", "databricks", "spark", "delta"],
        imageUrl: "/images/projects/lakehouse-platform-case.svg",
      },
      {
        keywords: ["gcp", "bigquery", "dbt", "analytics-engineering"],
        imageUrl: "/images/projects/gcp-modern-stack-case.svg",
      },
      {
        keywords: ["snowflake", "cross-cloud", "azure", "warehouse-ingestion"],
        imageUrl: "/images/projects/snowflake-governance-case.svg",
      },
      {
        keywords: ["genai", "rag", "text-to-sql", "llm", "agent", "ai"],
        imageUrl: "/images/projects/ai-analytics-agent-case.svg",
      },
    ], "/images/projects/lakehouse-platform-case.svg");
}

export function resolveArticleImage(input: ImageResolveInput) {
  if (!isStockEditorialImage(input.imageUrl)) {
    return input.imageUrl ?? undefined;
  }

  const haystack = buildHaystack(input);

  return ARTICLE_IMAGE_BY_SLUG[input.slug]
    ?? pickByRules(haystack, [
      {
        keywords: ["streaming", "kafka", "cdc", "real-time", "realtime"],
        imageUrl: "/images/articles/real-time-architectures.svg",
      },
      {
        keywords: ["genai", "rag", "text-to-sql", "governance", "ai and analytics"],
        imageUrl: "/images/articles/governed-ai-analytics.svg",
      },
      {
        keywords: ["agentic-ai", "inference", "gartner", "nvidia", "agent"],
        imageUrl: "/images/articles/agentic-ai-platforms.svg",
      },
      {
        keywords: ["lakehouse", "snowflake", "dbt", "terraform", "platform", "modernization"],
        imageUrl: "/images/articles/platform-modernization-patterns.svg",
      },
      {
        keywords: ["business-value", "data-strategy", "ai-adoption"],
        imageUrl: "/images/articles/from-news-to-data-product.svg",
      },
    ], "/images/articles/platform-modernization-patterns.svg");
}

export function resolveNewsImage(input: ImageResolveInput) {
  if (!isStockEditorialImage(input.imageUrl)) {
    return input.imageUrl ?? undefined;
  }

  const haystack = buildHaystack(input);

  return NEWS_IMAGE_BY_SLUG[input.slug]
    ?? pickByRules(haystack, [
      {
        keywords: ["linkedin", "community", "social"],
        imageUrl: "/images/news/community-automation-signal.svg",
      },
      {
        keywords: ["streaming", "kafka", "cdc", "real-time", "realtime"],
        imageUrl: "/images/news/streaming-signal.svg",
      },
      {
        keywords: ["databricks", "lakehouse", "delta"],
        imageUrl: "/images/news/lakehouse-signal.svg",
      },
      {
        keywords: ["snowflake", "warehouse", "analytics platforms", "analytics-platforms"],
        imageUrl: "/images/news/analytics-platform-signal.svg",
      },
      {
        keywords: ["dbt", "analytics-engineering", "transformation", "modern-data-stack"],
        imageUrl: "/images/news/transformation-signal.svg",
      },
      {
        keywords: ["ai", "genai", "llm", "gcp", "cloud & ai", "cloud e ia"],
        imageUrl: "/images/news/cloud-ai-signal.svg",
      },
      {
        keywords: ["aws", "azure", "cloud", "data-platform"],
        imageUrl: "/images/news/cloud-platform-signal.svg",
      },
    ], "/images/news/cloud-platform-signal.svg");
}
