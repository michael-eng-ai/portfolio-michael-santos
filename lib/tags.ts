type TagEntry = { label: string; hashtag: string };

const TAG_CONFIG: Record<string, TagEntry> = {
  ai: { label: "AI", hashtag: "#AI" },
  lakehouse: { label: "Lakehouse", hashtag: "#Lakehouse" },
  dbt: { label: "dbt", hashtag: "#dbt" },
  kafka: { label: "Kafka", hashtag: "#Kafka" },
  streaming: { label: "Streaming", hashtag: "#RealTimeData" },
  governance: { label: "Data Governance", hashtag: "#DataGovernance" },
  snowflake: { label: "Snowflake", hashtag: "#Snowflake" },
  bigquery: { label: "BigQuery", hashtag: "#BigQuery" },
  databricks: { label: "Databricks", hashtag: "#Databricks" },
  mlops: { label: "MLOps", hashtag: "#MLOps" },
  llm: { label: "LLM", hashtag: "#LLM" },
  genai: { label: "GenAI", hashtag: "#GenAI" },
  rag: { label: "RAG", hashtag: "#RAG" },
  python: { label: "Python", hashtag: "#Python" },
  "open-source": { label: "Open Source", hashtag: "#OpenSource" },
  aws: { label: "AWS", hashtag: "#AWS" },
  gcp: { label: "GCP", hashtag: "#GoogleCloud" },
  analytics: { label: "Analytics", hashtag: "#Analytics" },
  "data-platform": { label: "Data Platform", hashtag: "#DataPlatform" },
  "analytics-engineering": { label: "Analytics Engineering", hashtag: "#AnalyticsEngineering" },
  "modern-data-stack": { label: "Modern Data Stack", hashtag: "#ModernDataStack" },
};

export const BROAD_HASHTAGS = [
  "#DataEngineering",
  "#MachineLearning",
  "#BigData",
  "#CloudComputing",
];

function toTitleCase(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function getTagLabel(slug: string): string {
  return TAG_CONFIG[slug]?.label ?? toTitleCase(slug);
}

export function getTagHashtag(slug: string): string {
  return TAG_CONFIG[slug]?.hashtag ?? `#${toTitleCase(slug).replace(/\s/g, "")}`;
}
