import { Database, Zap, TrendingUp, Cloud, Lock, BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";

const services = [
  {
    icon: Database,
    title: "Arquitetura de Dados",
    description:
      "Design de soluções escaláveis de Big Data, data lakes e data warehouses. Estruturas modernas para máximo valor dos seus dados.",
    features: ["Data Lake Design", "Schema Optimization", "Data Governance"],
  },
  {
    icon: Zap,
    title: "Engenharia de ETL/ELT",
    description:
      "Pipelines de dados robustos e automatizados. Integração de múltiplas fontes com qualidade garantida e processamento em tempo real.",
    features: ["Pipeline Development", "Data Quality", "Real-time Processing"],
  },
  {
    icon: TrendingUp,
    title: "Business Intelligence",
    description:
      "Transformação de dados em insights acionáveis. Dashboards e relatórios que guiam decisões estratégicas de negócio.",
    features: ["Dashboard Design", "Data Visualization", "KPI Tracking"],
  },
  {
    icon: Cloud,
    title: "Migração para Nuvem",
    description:
      "Transição segura e eficiente para GCP, AWS ou Azure. Minimizando downtime e maximizando performance.",
    features: ["Cloud Strategy", "Migration Planning", "Cost Optimization"],
  },
  {
    icon: Lock,
    title: "Segurança de Dados",
    description:
      "Implementação de práticas de segurança, compliance e proteção de dados. Conformidade com LGPD, GDPR e regulamentações.",
    features: ["Data Protection", "Compliance", "Audit Trails"],
  },
  {
    icon: BarChart3,
    title: "Consultoria Estratégica",
    description:
      "Alinhamento de tecnologia com objetivos de negócio. Roadmap de transformação digital e otimização de processos.",
    features: ["Strategy Planning", "Process Optimization", "Team Training"],
  },
];

export default function Services() {
  return (
    <section id="services" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="max-w-2xl mb-16">
          <p className="font-accent text-primary text-sm uppercase tracking-widest mb-2">
            Serviços
          </p>
          <h2 className="font-display text-foreground mb-4">
            Soluções Completas de Dados
          </h2>
          <p className="font-body text-lg text-muted-foreground">
            Oferecemos um portfólio completo de serviços em engenharia de dados, desde arquitetura até consultoria estratégica.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, idx) => {
            const Icon = service.icon;
            return (
              <Card
                key={idx}
                className="p-8 hover:shadow-lg transition-shadow duration-300 border border-border hover:border-primary/50"
              >
                {/* Icon */}
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
                    <Icon size={24} />
                  </div>
                </div>

                {/* Content */}
                <h3 className="font-heading text-foreground mb-3">
                  {service.title}
                </h3>
                <p className="font-body text-sm text-muted-foreground mb-6">
                  {service.description}
                </p>

                {/* Features */}
                <ul className="space-y-2">
                  {service.features.map((feature, fidx) => (
                    <li
                      key={fidx}
                      className="font-accent text-xs text-foreground flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="font-body text-muted-foreground mb-6">
            Não encontrou o que procura? Vamos conversar sobre sua necessidade específica.
          </p>
          <a
            href="#contact"
            className="inline-flex items-center justify-center px-8 py-3 bg-primary text-primary-foreground rounded-md font-accent hover:bg-primary/90 transition-colors"
          >
            Solicitar Consulta
          </a>
        </div>
      </div>
    </section>
  );
}
