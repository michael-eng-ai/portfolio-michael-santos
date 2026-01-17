import { ArrowRight, Calendar, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAnalytics } from "@/hooks/useAnalytics";

const blogArticles = [
  {
    id: 17,
    title: "Data Mesh em 2026: A Revolução da Engenharia de Dados Distribuída",
    excerpt:
      "Descubra como o Data Mesh está transformando a engenharia de dados com descentralização, agilidade e governança federada em 2026.",
    date: "17 de janeiro de 2026",
    readTime: "6 min",
    category: "Arquitetura de Dados",
    tags: ["Data Mesh", "Engenharia de Dados", "Arquitetura Distribuída"],
    link: "/blog/data-mesh-em-2026-a-revolucao-da-engenharia-de-dados-distribuida",
  },
  {
    id: 16,
    title: "Data Mesh em 2026: Revolucionando a Engenharia de Dados e IA Empresarial",
    excerpt:
      "Descubra como o Data Mesh está transformando a engenharia de dados e impulsionando aplicações de IA escaláveis e ágeis nas empresas em 2026.",
    date: "16 de janeiro de 2026",
    readTime: "5 min",
    category: "IA & Dados",
    tags: ["Data Mesh", "Engenharia de Dados", "Inteligência Artificial"],
    link: "/blog/data-mesh-em-2026-revolucionando-a-engenharia-de-dados-e-ia-empresarial",
  },
  {
    id: 15,
    title: "Data Mesh em 2026: A Revolução na Engenharia de Dados Corporativos",
    excerpt:
      "Descubra como Data Mesh está transformando a gestão de dados em grandes organizações, promovendo descentralização, agilidade e escalabilidade.",
    date: "15 de janeiro de 2026",
    readTime: "5 min",
    category: "Arquitetura de Dados",
    tags: ["Data Mesh", "Engenharia de Dados", "Arquitetura Descentralizada"],
    link: "/blog/data-mesh-em-2026-a-revolucao-na-engenharia-de-dados-corporativos",
  },
  {
    id: 14,
    title: "Computação Generativa: A Revolução da IA na Engenharia de Dados em 2026",
    excerpt:
      "Explore como a computação generativa está transformando a engenharia de dados, impulsionando inovações e otimizando decisões estratégicas em 2026.",
    date: "14 de Janeiro de 2026",
    readTime: "4 min",
    category: "IA & Dados",
    tags: ["Computação Generativa", "Engenharia de Dados", "Inteligência Artificial"],
    link: "/blog/computacao-generativa",
  },
  {
    id: 13,
    title: "AI-Ready Data: A Fundação Invisível que Separa o Sucesso do Fracasso em IA",
    excerpt:
      "Com 95% de taxa de falha em projetos de IA devido a problemas de dados, 2026 será o ano em que investimentos em dados prontos para IA eclipsarão o desenvolvimento de agentes. Descubra por que a fundação invisível dos dados é o verdadeiro diferencial competitivo.",
    date: "12 de Janeiro de 2026",
    readTime: "7 min",
    category: "IA & Dados",
    tags: ["AI-Ready Data", "Governança", "Semantic Layers"],
    link: "/blog/ai-ready-data",
  },
  {
    id: 1,
    title: "Dados Sintéticos: A Solução para o Dilema de Treinamento de IA em 2025",
    excerpt:
      "Em 2025, a indústria de IA enfrentou um desafio crítico: os dados reais estão acabando. Descubra como engenheiros de dados estão usando dados sintéticos para resolver esse gargalo existencial.",
    date: "31 de Dezembro de 2025",
    readTime: "8 min",
    category: "IA & Machine Learning",
    tags: ["Dados Sintéticos", "IA", "Treinamento de Modelos"],
    link: "/blog/dados-sinteticos",
  },
  {
    id: 2,
    title: "Semantic Layers: O Novo Padrão de Arquitetura de Dados em 2025",
    excerpt:
      "Semantic layers estão se tornando o padrão de ouro em arquiteturas de dados. Saiba como essa camada de abstração revoluciona a forma como empresas gerenciam seus dados.",
    date: "28 de Dezembro de 2025",
    readTime: "10 min",
    category: "Arquitetura de Dados",
    tags: ["Semantic Layer", "Arquitetura", "dbt"],
    link: "/blog/semantic-layers",
  },
  {
    id: 3,
    title: "Cloud Computing em 2025: Da Otimização de Custos à Inovação de Infraestrutura",
    excerpt:
      "2025 foi o ano em que data centers saíram do backstage. Entenda como modelos híbridos estão mudando a forma como empresas usam cloud e otimizam custos.",
    date: "25 de Dezembro de 2025",
    readTime: "9 min",
    category: "Cloud & Infraestrutura",
    tags: ["Cloud", "Híbrido", "Otimização de Custos"],
    link: "/blog/cloud-hibrido",
  },
  {
    id: 4,
    title: "AI Agents e Data Engineering: Quando Dados Encontram Autonomia",
    excerpt:
      "AI agents deixaram de ser ficção científica. Descubra como engenheiros de dados estão construindo pipelines para alimentar sistemas autônomos de IA.",
    date: "22 de Dezembro de 2025",
    readTime: "7 min",
    category: "IA & Automação",
    tags: ["AI Agents", "Automação", "Qualidade de Dados"],
    link: "/blog/ai-agents",
  },
  {
    id: 5,
    title: "2026: O Ano em Que Dados Deixam de Ser Suporte e Viram Estratégia",
    excerpt:
      "Dados não são mais um custo necessário. Em 2025, se tornaram ativos estratégicos que geram receita. Saiba como se posicionar para essa transformação.",
    date: "20 de Dezembro de 2025",
    readTime: "6 min",
    category: "Estratégia",
    tags: ["Transformação Digital", "Receita", "Estratégia"],
    link: "/blog/dados-estrategia",
  },
  {
    id: 6,
    title: "Tendências em Data Engineering para 2026: O Que Esperar",
    excerpt:
      "Mudanças estruturais superam frameworks da moda. Conheça as 6 tendências que vão dominar data engineering em 2026 e como se preparar.",
    date: "18 de Dezembro de 2025",
    readTime: "11 min",
    category: "Tendências",
    tags: ["Data Mesh", "Observabilidade", "Infraestrutura"],
    link: "/blog/tendencias-2026",
  },
  {
    id: 7,
    title: "Real-Time Data Processing: O Futuro Agora",
    excerpt:
      "Em 2026, processamento em tempo real deixou de ser opcional. Descubra como engenheiros de dados estão construindo arquiteturas que tomam decisões em milissegundos.",
    date: "15 de Janeiro de 2026",
    readTime: "9 min",
    category: "Arquitetura em Tempo Real",
    tags: ["Streaming", "Kafka", "Flink"],
    link: "/blog/real-time-processing",
  },
  {
    id: 8,
    title: "Edge AI: Quando a Inteligência Sai da Nuvem",
    excerpt:
      "Edge AI está transformando como implementamos IA. Saiba como executar modelos localmente para melhor latência, privacidade e custo.",
    date: "12 de Janeiro de 2026",
    readTime: "8 min",
    category: "IA Distribuída",
    tags: ["Edge Computing", "IoT", "TensorFlow Lite"],
    link: "/blog/edge-ai",
  },
  {
    id: 9,
    title: "Vector Databases: A Revolução da Busca Semântica",
    excerpt:
      "Vector databases são a infraestrutura crítica para IA generativa. Entenda como implementar busca semântica em seus dados.",
    date: "10 de Janeiro de 2026",
    readTime: "10 min",
    category: "Bancos de Dados",
    tags: ["Vector DB", "Embeddings", "Busca Semântica"],
    link: "/blog/vector-databases",
  },
  {
    id: 10,
    title: "Data Observability: Monitorando a Saúde dos Seus Dados",
    excerpt:
      "Dados ruins passam despercebidos até causar problemas. Descubra como implementar observabilidade de dados para confiabilidade.",
    date: "8 de Janeiro de 2026",
    readTime: "9 min",
    category: "Confiabilidade",
    tags: ["Qualidade de Dados", "Monitoramento", "Anomalias"],
    link: "/blog/data-observability",
  },
  {
    id: 11,
    title: "Data Fabric: Arquitetura Unificada para Dados Distribuídos",
    excerpt:
      "Data fabric conecta e unifica todas as fontes de dados. Saiba como implementar uma arquitetura que escala com seu negócio.",
    date: "5 de Janeiro de 2026",
    readTime: "11 min",
    category: "Arquitetura de Dados",
    tags: ["Data Fabric", "Integração", "Governança"],
    link: "/blog/data-fabric",
  },
  {
    id: 12,
    title: "Data Privacy by Design: LGPD, GDPR e Compliance em 2026",
    excerpt:
      "Privacidade não é um add-on. Descubra como implementar privacy by design desde o início para evitar riscos regulatórios.",
    date: "2 de Janeiro de 2026",
    readTime: "10 min",
    category: "Compliance",
    tags: ["LGPD", "GDPR", "Privacidade"],
    link: "/blog/privacy-by-design",
  },
];

export default function Blog() {
  const { trackArticleClick } = useAnalytics();

  const handleArticleClick = (id: number, title: string) => {
    trackArticleClick(`article-${id}`, title);
  };
  return (
    <section id="blog" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="max-w-2xl mb-16">
          <p className="font-accent text-primary text-sm uppercase tracking-widest mb-2">
            Blog & Insights
          </p>
          <h2 className="font-display text-foreground mb-4">
            Tendências de Dados em Tempo Real
          </h2>
          <p className="font-body text-lg text-muted-foreground">
            Análises profundas sobre as principais tendências em engenharia de dados, IA e transformação digital. Conectando notícias globais com aplicações práticas.
          </p>
        </div>

        {/* Featured Article */}
        <div className="mb-16">
          <Card className="overflow-hidden border border-border hover:shadow-lg transition-shadow duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Image */}
              <div className="relative h-64 md:h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center min-h-64">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/30 mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/50" />
                  </div>
                  <p className="font-accent text-sm text-muted-foreground">
                    Destaque
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full font-accent text-xs">
                      {blogArticles[0].category}
                    </span>
                    <span className="font-accent text-xs text-muted-foreground flex items-center gap-1">
                      <Clock size={14} />
                      {blogArticles[0].readTime}
                    </span>
                  </div>
                  <h3 className="font-heading text-foreground mb-3">
                    {blogArticles[0].title}
                  </h3>
                  <p className="font-body text-muted-foreground mb-4">
                    {blogArticles[0].excerpt}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <p className="font-accent text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar size={14} />
                    {blogArticles[0].date}
                  </p>
                  <a
                    href={blogArticles[0].link}
                    onClick={() => handleArticleClick(blogArticles[0].id, blogArticles[0].title)}
                    className="inline-flex items-center text-primary font-accent text-sm hover:gap-2 transition-all group"
                  >
                    Ler Artigo
                    <ArrowRight
                      size={16}
                      className="ml-1 group-hover:translate-x-1 transition-transform"
                    />
                  </a>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogArticles.slice(1).map((article) => (
            <Card
              key={article.id}
              className="overflow-hidden hover:shadow-lg transition-shadow duration-300 border border-border flex flex-col"
            >
              {/* Header */}
              <div className="p-6 pb-4 border-b border-border">
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 bg-muted text-foreground rounded-full font-accent text-xs">
                    {article.category}
                  </span>
                  <span className="font-accent text-xs text-muted-foreground">
                    {article.readTime}
                  </span>
                </div>
                <h3 className="font-heading text-foreground">
                  {article.title}
                </h3>
              </div>

              {/* Content */}
              <div className="p-6 flex-grow flex flex-col">
                <p className="font-body text-sm text-muted-foreground mb-4 flex-grow">
                  {article.excerpt}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {article.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-primary/10 text-primary text-xs rounded font-accent"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <p className="font-accent text-xs text-muted-foreground">
                    {article.date}
                  </p>
                  <a
                    href={article.link}
                    onClick={() => handleArticleClick(article.id, article.title)}
                    className="inline-flex items-center text-primary font-accent text-sm hover:gap-2 transition-all group"
                  >
                    Ler
                    <ArrowRight
                      size={14}
                      className="ml-1 group-hover:translate-x-1 transition-transform"
                    />
                  </a>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="font-body text-muted-foreground mb-6">
            Quer receber novos artigos e insights sobre dados diretamente no seu email?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="seu@email.com"
              className="flex-1 px-4 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground font-body text-sm"
            />
            <button className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-accent text-sm hover:bg-primary/90 transition-colors">
              Inscrever
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
