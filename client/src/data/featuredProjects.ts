export type FeaturedProject = {
  slug: string;
  title: string;
  subtitle: string;
  summary: string;
  businessProblem: string;
  technicalSolution: string[];
  architectureSummary: string;
  stack: string[];
  impact: string[];
  githubUrl: string;
};

export const featuredProjects: FeaturedProject[] = [
  {
    slug: "kafka-debezium-dbt",
    title: "Real-Time CDC Analytics Pipeline",
    subtitle: "Operational data to analytics-ready layers with low latency",
    summary:
      "A CDC architecture that captures relational database changes in near real time and transforms them into bronze, silver, and gold analytical layers.",
    businessProblem:
      "Analytics teams often need fresher warehouse data without relying on opaque or heavyweight ELT setups. This project demonstrates how to move changes from operational PostgreSQL systems into analytics-ready layers with low latency and clear transformation ownership.",
    technicalSolution: [
      "PostgreSQL logical replication with Debezium and Kafka Connect",
      "Python consumer for payload normalization and UPSERT handling",
      "dbt models for bronze, silver, and gold layers",
      "Streamlit dashboard for operational and analytical visibility",
    ],
    architectureSummary:
      "PostgreSQL -> Debezium -> Kafka -> Python consumer -> PostgreSQL target -> dbt -> Streamlit",
    stack: ["PostgreSQL", "Debezium", "Kafka", "Python", "dbt", "Streamlit", "Docker"],
    impact: [
      "Shows a practical CDC alternative for internal systems",
      "Connects ingestion, transformation, and consumption in one pipeline",
      "Demonstrates analytics engineering with fresher data movement",
    ],
    githubUrl: "https://github.com/michael-eng-ai/kafka-debezium-dbt",
  },
  {
    slug: "aws-databricks-lakehouse",
    title: "AWS And Databricks Lakehouse",
    subtitle: "Medallion-style cloud data platform with Terraform and PySpark",
    summary:
      "A lakehouse architecture that separates cloud storage and compute while applying medallion processing patterns with Databricks and Delta Lake.",
    businessProblem:
      "Teams modernizing data platforms need a scalable path from raw event data to governed analytical layers without tightly coupling storage and compute. This project models that foundation on AWS and Databricks.",
    technicalSolution: [
      "Terraform-managed AWS infrastructure",
      "S3-based raw and processed storage layers",
      "PySpark jobs for silver and gold processing",
      "Delta Lake outputs aligned to medallion responsibilities",
    ],
    architectureSummary:
      "Terraform provisions AWS resources, sample event data lands in S3, and Databricks jobs transform raw data into refined analytical layers.",
    stack: ["AWS", "S3", "Terraform", "Databricks", "PySpark", "Delta Lake", "Python"],
    impact: [
      "Demonstrates platform thinking beyond isolated ETL scripts",
      "Shows infrastructure, ingestion, and transformation working together",
      "Supports discussions around lakehouse design and Spark engineering",
    ],
    githubUrl: "https://github.com/michael-eng-ai/aws-databricks-lakehouse",
  },
  {
    slug: "gcp-dbt-modern-data-stack",
    title: "GCP Modern Data Stack",
    subtitle: "Analytics engineering on BigQuery with dbt and Terraform",
    summary:
      "A modern warehouse-oriented stack that combines infrastructure provisioning, Python ingestion, dbt transformations, and CI/CD on GCP.",
    businessProblem:
      "Analytics teams need a repeatable way to move from source extraction to tested business models without relying on manual cloud setup and undocumented SQL logic.",
    technicalSolution: [
      "Terraform provisioning for storage and BigQuery resources",
      "Python extraction and load process",
      "dbt transformations for analytics-ready models",
      "CI/CD support for repeatable execution",
    ],
    architectureSummary:
      "Python ingests source data into GCP, dbt transforms it in BigQuery, and infrastructure plus execution logic are managed as code.",
    stack: ["GCP", "BigQuery", "Cloud Storage", "Python", "dbt", "Terraform", "GitHub Actions"],
    impact: [
      "Demonstrates analytics engineering patterns in a cloud-native setup",
      "Shows testable warehouse transformation practices",
      "Connects ingestion, modeling, and automation in one portfolio case",
    ],
    githubUrl: "https://github.com/michael-eng-ai/gcp-dbt-modern-data-stack",
  },
  {
    slug: "azure-snowflake-pipeline",
    title: "Azure To Snowflake Pipeline",
    subtitle: "Cross-cloud ingestion and warehouse modeling flow",
    summary:
      "A cross-cloud architecture that uses Azure storage for landing data and Snowflake for ingestion and analytical modeling.",
    businessProblem:
      "Organizations operating across cloud providers often need to connect storage, ingestion, and warehousing without building large custom integration layers.",
    technicalSolution: [
      "Terraform-managed Azure storage resources",
      "Python-generated sample data flow into ADLS Gen2",
      "Snowflake storage integration and Snowpipe ingestion",
      "Warehouse-side SQL modeling for refined analytical layers",
    ],
    architectureSummary:
      "Azure lands the data, Snowflake ingests it through managed integration patterns, and SQL builds analytical structures on top.",
    stack: ["Azure", "ADLS Gen2", "Snowflake", "Snowpipe", "Terraform", "Python", "SQL"],
    impact: [
      "Demonstrates cross-cloud architecture design",
      "Shows warehouse-oriented ingestion patterns",
      "Supports discussions around Snowflake, cloud integration, and analytical modeling",
    ],
    githubUrl: "https://github.com/michael-eng-ai/azure-snowflake-pipeline",
  },
  {
    slug: "streaming-kafka-fastapi",
    title: "Streaming Radar API",
    subtitle: "Event-driven streaming architecture with low-latency serving",
    summary:
      "A streaming architecture with producer, consumer, Redis serving layer, and FastAPI endpoints built around Kafka.",
    businessProblem:
      "Systems that depend on live data need a clean path from event ingestion to low-latency API delivery. This project demonstrates how to expose processed streaming data through a simple but structured architecture.",
    technicalSolution: [
      "Kafka as the event backbone",
      "Python producer and consumer services",
      "Redis as low-latency serving state",
      "FastAPI for external API access",
    ],
    architectureSummary:
      "Streaming events flow through Kafka, are processed by Python services, stored in Redis, and exposed through FastAPI endpoints.",
    stack: ["Kafka", "Redis", "FastAPI", "Python", "Docker"],
    impact: [
      "Demonstrates event-driven architecture in a compact runnable system",
      "Shows how streaming data can be operationalized for API consumption",
      "Useful as a portfolio case for real-time and asynchronous systems",
    ],
    githubUrl: "https://github.com/michael-eng-ai/streaming-kafka-fastapi",
  },
  {
    slug: "ai-data-analyst-bot",
    title: "AI Data Analyst Bot",
    subtitle: "Text-to-SQL and RAG for business-facing data access",
    summary:
      "An AI-enabled analytics assistant that combines Text-to-SQL and retrieval workflows to support warehouse and document exploration.",
    businessProblem:
      "Business users often need faster access to data and documentation without writing SQL or navigating multiple internal systems manually.",
    technicalSolution: [
      "Intent routing between analytical and retrieval tasks",
      "Text-to-SQL workflow for structured warehouse questions",
      "RAG workflow for documentation and glossary questions",
      "Streamlit interface for a business-friendly experience",
    ],
    architectureSummary:
      "The application routes user questions into either SQL generation or retrieval workflows and returns grounded responses through a simple interface.",
    stack: ["Python", "Streamlit", "Gemini", "LangChain", "LangGraph", "BigQuery", "Terraform"],
    impact: [
      "Shows how AI can extend analytics access responsibly",
      "Demonstrates practical grounding and hallucination-aware architecture",
      "Adds an AI-enabled data product angle to the portfolio",
    ],
    githubUrl: "https://github.com/michael-eng-ai/AI-Data-Analyst-Bot",
  },
];

export const featuredProjectsBySlug = Object.fromEntries(
  featuredProjects.map((project) => [project.slug, project]),
) as Record<string, FeaturedProject>;
