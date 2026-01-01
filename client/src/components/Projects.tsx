import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";

const projects = [
  {
    id: 1,
    title: "Prevenção de Fraudes em Transações Bancárias",
    subtitle: "Arquitetura de Dados para Detecção em Tempo Real",
    description:
      "Implementação de pipeline de dados escalável para detecção de fraudes em transações bancárias, integrando múltiplas fontes de dados e algoritmos de machine learning.",
    image: "/images/case-study-fraud-detection.jpg",
    technologies: ["Azure Data Lake", "Databricks", "GCP", "Oracle", "Kafka"],
    impact: [
      "Redução de 45% em fraudes não detectadas",
      "Processamento em tempo real de 1M+ transações/dia",
      "ROI de 3x em 12 meses",
    ],
    link: "#",
  },
  {
    id: 2,
    title: "Otimização de Atendimento em Healthcare",
    subtitle: "Integração de Dados para Insights de Pacientes",
    description:
      "Criação de pipelines no GCP e AWS integrando CRM, chatbot, Watson Assistant e Sendbird para gerar insights sobre experiência de clientes de saúde.",
    image: "/images/case-study-healthcare-insights.jpg",
    technologies: ["GCP", "AWS", "BigQuery", "Google Analytics", "Qlik Sense"],
    impact: [
      "Aumento de 38% na satisfação do cliente",
      "Redução de 25% no tempo de resposta",
      "Insights acionáveis em <24h",
    ],
    link: "#",
  },
  {
    id: 3,
    title: "Automação de Processos Financeiros",
    subtitle: "ETL Pipeline para Eficiência Operacional",
    description:
      "Automação de processos regulatórios e financeiros usando Airflow, integrando SAP e GCP para geração automática de relatórios e otimização de validação de dados.",
    image: "/images/case-study-automation-efficiency.jpg",
    technologies: ["AWS Airflow", "GCP Composer", "Docker", "Python", "MongoDB"],
    impact: [
      "Redução de 60% em tempo manual de processamento",
      "Eliminação de 95% de erros manuais",
      "Economia de R$ 500k+ anuais",
    ],
    link: "#",
  },
];

export default function Projects() {
  return (
    <section id="projects" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="max-w-2xl mb-16">
          <p className="font-accent text-primary text-sm uppercase tracking-widest mb-2">
            Casos de Sucesso
          </p>
          <h2 className="font-display text-foreground mb-4">
            Projetos que Geraram Impacto Real
          </h2>
          <p className="font-body text-lg text-muted-foreground">
            Cada projeto é uma história de transformação digital. Veja como implementei soluções de dados que resolvem problemas complexos e geram valor mensurável.
          </p>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="overflow-hidden hover:shadow-lg transition-shadow duration-300 border border-border"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden bg-muted">
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div>
                  <p className="font-accent text-xs text-primary uppercase tracking-widest mb-2">
                    {project.subtitle}
                  </p>
                  <h3 className="font-heading text-foreground">
                    {project.title}
                  </h3>
                </div>

                <p className="font-body text-sm text-muted-foreground">
                  {project.description}
                </p>

                {/* Technologies */}
                <div className="flex flex-wrap gap-2">
                  {project.technologies.slice(0, 3).map((tech) => (
                    <span
                      key={tech}
                      className="px-3 py-1 bg-muted text-foreground text-xs rounded-full font-accent"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                {/* Impact */}
                <div className="space-y-2 pt-4 border-t border-border">
                  {project.impact.map((item, idx) => (
                    <p
                      key={idx}
                      className="font-accent text-xs text-primary flex items-start gap-2"
                    >
                      <span className="mt-1">✓</span>
                      {item}
                    </p>
                  ))}
                </div>

                {/* CTA */}
                <a
                  href={project.link}
                  className="inline-flex items-center text-primary font-accent text-sm hover:gap-2 transition-all group pt-2"
                >
                  Ler Case Completo
                  <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
