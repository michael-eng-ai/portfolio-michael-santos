export type RadarRing = "adopt" | "trial" | "assess" | "hold";
export type RadarQuadrant = "data-processing" | "storage-query" | "orchestration-ops" | "ai-ml";

export type RadarEntry = {
  name: string;
  quadrant: RadarQuadrant;
  ring: RadarRing;
  description: { en: string; pt: string };
  moved?: "up" | "down" | "none";
};

export const radarRings: Record<RadarRing, { label: { en: string; pt: string }; color: string }> = {
  adopt: { label: { en: "Adopt", pt: "Adotar" }, color: "#22c55e" },
  trial: { label: { en: "Trial", pt: "Experimentar" }, color: "#3b82f6" },
  assess: { label: { en: "Assess", pt: "Avaliar" }, color: "#f59e0b" },
  hold: { label: { en: "Hold", pt: "Manter" }, color: "#ef4444" },
};

export const radarQuadrants: Record<RadarQuadrant, { label: { en: string; pt: string } }> = {
  "data-processing": { label: { en: "Data Processing", pt: "Processamento de Dados" } },
  "storage-query": { label: { en: "Storage & Query", pt: "Armazenamento & Consulta" } },
  "orchestration-ops": { label: { en: "Orchestration & Ops", pt: "Orquestracao & Ops" } },
  "ai-ml": { label: { en: "AI & ML", pt: "IA & ML" } },
};

export const radarEntries: RadarEntry[] = [
  // Data Processing
  {
    name: "Apache Spark / PySpark",
    quadrant: "data-processing",
    ring: "adopt",
    description: {
      en: "De facto standard for large-scale batch and streaming processing. Mature ecosystem with Delta Lake integration.",
      pt: "Padrao de fato para processamento batch e streaming em larga escala. Ecossistema maduro com integracao Delta Lake.",
    },
    moved: "none",
  },
  {
    name: "dbt Core",
    quadrant: "data-processing",
    ring: "adopt",
    description: {
      en: "SQL-first transformation layer with testing, docs, and lineage. Essential for the modern data stack.",
      pt: "Camada de transformacao SQL-first com testes, docs e linhagem. Essencial para a stack moderna de dados.",
    },
    moved: "none",
  },
  {
    name: "Polars",
    quadrant: "data-processing",
    ring: "trial",
    description: {
      en: "Rust-based DataFrame library. 5-10x faster than pandas for single-node workloads. Growing adoption.",
      pt: "Biblioteca DataFrame baseada em Rust. 5-10x mais rapido que pandas para workloads single-node.",
    },
    moved: "up",
  },
  {
    name: "Apache Flink",
    quadrant: "data-processing",
    ring: "assess",
    description: {
      en: "True streaming-first engine. Superior to Spark Streaming for low-latency use cases but higher operational complexity.",
      pt: "Engine streaming-first real. Superior ao Spark Streaming para baixa latencia, mas maior complexidade operacional.",
    },
    moved: "none",
  },
  {
    name: "pandas",
    quadrant: "data-processing",
    ring: "hold",
    description: {
      en: "Still ubiquitous but showing age. Consider Polars for new projects. Keep for legacy and quick prototyping.",
      pt: "Ainda onipresente mas mostrando idade. Considere Polars para novos projetos. Manter para legado e prototipagem.",
    },
    moved: "down",
  },
  {
    name: "DuckDB",
    quadrant: "data-processing",
    ring: "trial",
    description: {
      en: "Embedded OLAP engine. Excellent for local analytics, CI testing, and replacing pandas for medium datasets.",
      pt: "Engine OLAP embeddado. Excelente para analytics local, testes CI e substituir pandas em datasets medios.",
    },
    moved: "up",
  },

  // Storage & Query
  {
    name: "Databricks (Unity Catalog)",
    quadrant: "storage-query",
    ring: "adopt",
    description: {
      en: "Unified lakehouse with governance. Delta Lake + Unity Catalog is the strongest open-format play.",
      pt: "Lakehouse unificado com governanca. Delta Lake + Unity Catalog e a jogada open-format mais forte.",
    },
    moved: "none",
  },
  {
    name: "Snowflake",
    quadrant: "storage-query",
    ring: "adopt",
    description: {
      en: "Best-in-class cloud data warehouse. Excellent for SQL-heavy workloads and cross-cloud sharing.",
      pt: "Data warehouse cloud top de linha. Excelente para workloads SQL-heavy e compartilhamento cross-cloud.",
    },
    moved: "none",
  },
  {
    name: "BigQuery",
    quadrant: "storage-query",
    ring: "trial",
    description: {
      en: "Serverless DW with strong ML integration. Great for GCP-native stacks. Pricing model needs attention.",
      pt: "DW serverless com forte integracao ML. Otimo para stacks GCP-native. Modelo de pricing precisa atencao.",
    },
    moved: "none",
  },
  {
    name: "Apache Iceberg",
    quadrant: "storage-query",
    ring: "trial",
    description: {
      en: "Open table format gaining momentum. Best choice for multi-engine lakehouse without vendor lock-in.",
      pt: "Formato de tabela aberto ganhando momento. Melhor escolha para lakehouse multi-engine sem vendor lock-in.",
    },
    moved: "up",
  },
  {
    name: "PostgreSQL",
    quadrant: "storage-query",
    ring: "adopt",
    description: {
      en: "The reliable workhorse. From OLTP to analytics extensions (pg_analytics). First choice for application databases.",
      pt: "O cavalo de batalha confiavel. De OLTP a extensoes analytics (pg_analytics). Primeira escolha para bancos de aplicacao.",
    },
    moved: "none",
  },
  {
    name: "Supabase",
    quadrant: "storage-query",
    ring: "trial",
    description: {
      en: "Postgres-as-a-service with auth, realtime, and edge functions. Great DX for full-stack data apps.",
      pt: "Postgres-as-a-service com auth, realtime e edge functions. Otimo DX para apps full-stack de dados.",
    },
    moved: "none",
  },

  // Orchestration & Ops
  {
    name: "Apache Airflow",
    quadrant: "orchestration-ops",
    ring: "adopt",
    description: {
      en: "Industry standard orchestrator. Complex but battle-tested. Astronomer makes it manageable.",
      pt: "Orquestrador padrao da industria. Complexo mas testado em batalha. Astronomer torna gerenciavel.",
    },
    moved: "none",
  },
  {
    name: "Terraform",
    quadrant: "orchestration-ops",
    ring: "adopt",
    description: {
      en: "Infrastructure as Code standard. Multi-cloud support is unmatched. OpenTofu as open-source fork.",
      pt: "Padrao de Infrastructure as Code. Suporte multi-cloud inigualavel. OpenTofu como fork open-source.",
    },
    moved: "none",
  },
  {
    name: "GitHub Actions",
    quadrant: "orchestration-ops",
    ring: "adopt",
    description: {
      en: "CI/CD tightly integrated with code. Simple for most pipelines. Matrix builds are powerful.",
      pt: "CI/CD integrado ao codigo. Simples para a maioria dos pipelines. Matrix builds sao poderosos.",
    },
    moved: "none",
  },
  {
    name: "Dagster",
    quadrant: "orchestration-ops",
    ring: "assess",
    description: {
      en: "Asset-centric orchestrator. Better developer experience than Airflow but smaller ecosystem.",
      pt: "Orquestrador centrado em assets. Melhor developer experience que Airflow mas ecossistema menor.",
    },
    moved: "up",
  },
  {
    name: "Docker / Containers",
    quadrant: "orchestration-ops",
    ring: "adopt",
    description: {
      en: "Non-negotiable for reproducible environments. Multi-stage builds, never run as root.",
      pt: "Inegociavel para ambientes reproduziveis. Multi-stage builds, nunca rodar como root.",
    },
    moved: "none",
  },
  {
    name: "Kafka / Debezium",
    quadrant: "orchestration-ops",
    ring: "trial",
    description: {
      en: "Event streaming + CDC. Essential for real-time data pipelines. Confluent Cloud simplifies ops.",
      pt: "Event streaming + CDC. Essencial para pipelines de dados real-time. Confluent Cloud simplifica ops.",
    },
    moved: "none",
  },

  // AI & ML
  {
    name: "Claude API / Anthropic",
    quadrant: "ai-ml",
    ring: "adopt",
    description: {
      en: "Leading LLM for code, analysis, and structured output. Best tool-use capabilities in the market.",
      pt: "LLM lider para codigo, analise e output estruturado. Melhores capacidades de tool-use do mercado.",
    },
    moved: "up",
  },
  {
    name: "LangChain / LangGraph",
    quadrant: "ai-ml",
    ring: "trial",
    description: {
      en: "Framework for LLM applications. LangGraph adds agent orchestration. Maturing but still evolving fast.",
      pt: "Framework para aplicacoes LLM. LangGraph adiciona orquestracao de agentes. Amadurecendo mas evoluindo rapido.",
    },
    moved: "none",
  },
  {
    name: "RAG (Retrieval-Augmented Generation)",
    quadrant: "ai-ml",
    ring: "adopt",
    description: {
      en: "Pattern for grounding LLMs with enterprise data. Vector search + embeddings + structured retrieval.",
      pt: "Padrao para fundamentar LLMs com dados corporativos. Vector search + embeddings + retrieval estruturado.",
    },
    moved: "none",
  },
  {
    name: "MLflow",
    quadrant: "ai-ml",
    ring: "adopt",
    description: {
      en: "MLOps platform for experiment tracking, model registry, and deployment. Native Databricks integration.",
      pt: "Plataforma MLOps para tracking de experimentos, registry de modelos e deploy. Integracao nativa Databricks.",
    },
    moved: "none",
  },
  {
    name: "Agentic AI",
    quadrant: "ai-ml",
    ring: "assess",
    description: {
      en: "Autonomous AI agents with tool use. Promising but needs guardrails. Claude Code, MCP, and Agent SDK lead.",
      pt: "Agentes IA autonomos com uso de ferramentas. Promissor mas precisa de guardrails. Claude Code, MCP e Agent SDK lideram.",
    },
    moved: "up",
  },
  {
    name: "Streamlit",
    quadrant: "ai-ml",
    ring: "trial",
    description: {
      en: "Fastest path from Python script to data app. Perfect for internal dashboards and ML demos.",
      pt: "Caminho mais rapido de script Python para data app. Perfeito para dashboards internos e demos de ML.",
    },
    moved: "none",
  },
];
