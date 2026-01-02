import { CheckCircle2, Award, Briefcase } from "lucide-react";

const skills = [
  "Arquitetura de Big Data",
  "Engenharia de ETL/ELT",
  "Cloud Computing (GCP, AWS, Azure)",
  "Business Intelligence & Analytics",
  "Liderança de Projetos",
  "Comunicação Estratégica",
];

const softSkills = [
  {
    title: "Visão de Negócio",
    description: "Compreensão profunda de como dados geram valor para o negócio",
  },
  {
    title: "Comunicação Excepcional",
    description: "Capacidade de traduzir complexidade técnica em linguagem de negócio",
  },
  {
    title: "Orientação a Resultados",
    description: "Foco em entregas mensuráveis e impacto direto no bottom line",
  },
  {
    title: "Colaboração Cross-Funcional",
    description: "Trabalho efetivo com múltiplas áreas e stakeholders",
  },
];

const timeline = [
  {
    year: "2019",
    title: "Data Analyst",
    company: "Primeiras Experiências",
    description: "Comecei minha jornada em dados com análise exploratória e relatórios em BI",
    icon: "📊",
  },
  {
    year: "2020-2021",
    title: "Business Intelligence Engineer",
    company: "Evolução para BI",
    description: "Construí dashboards estratégicos e implementei data warehouses",
    icon: "📈",
  },
  {
    year: "2022-2023",
    title: "Data Engineer",
    company: "Especialização Técnica",
    description: "Arquitetei pipelines em escala, trabalhei com Kafka, Spark, cloud platforms",
    icon: "⚙️",
  },
  {
    year: "2024",
    title: "Data Consultant & Entrepreneur",
    company: "Visão Estratégica",
    description: "Fundei Datasanti e atuo como consultor estratégico, não apenas técnico",
    icon: "🚀",
  },
];

const certifications = [
  "Azure Data Engineer Associate",
  "AWS Solutions Architect",
  "Google Cloud Professional Data Engineer",
  "Databricks Certified Associate",
];

export default function About() {
  return (
    <section id="about" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <p className="font-accent text-primary text-sm uppercase tracking-widest mb-3">
            Sobre Mim
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Engenheiro de Dados com Visão Estratégica
          </h2>
          <p className="font-body text-lg text-muted-foreground">
            Mais de 5 anos transformando dados brutos em decisões estratégicas. Minha trajetória combina expertise técnica profunda com visão de negócio aguçada.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mb-16">
          {/* Left Column - Content */}
          <div className="space-y-8">
            <p className="font-body text-lg text-muted-foreground">
              Comecei como Data Analyst, evoluí para Business Intelligence e agora atuo como Data Engineer estratégico. Essa jornada me deu uma perspectiva única: entendo tanto a complexidade técnica quanto o impacto no negócio.
            </p>

            {/* Soft Skills */}
            <div className="space-y-4">
              <h3 className="font-heading text-foreground text-xl">
                Meu Diferencial
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {softSkills.map((skill, idx) => (
                  <div key={idx} className="space-y-2">
                    <p className="font-accent text-foreground flex items-center gap-2">
                      <CheckCircle2 size={18} className="text-primary" />
                      {skill.title}
                    </p>
                    <p className="font-body text-sm text-muted-foreground pl-6">
                      {skill.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <a
              href="#contact"
              className="inline-flex items-center justify-center px-8 py-3 bg-primary text-primary-foreground rounded-md font-accent hover:bg-primary/90 transition-colors"
            >
              Vamos Conversar
            </a>
          </div>

          {/* Right Column - Skills */}
          <div className="space-y-8">
            <div>
              <h3 className="font-heading text-foreground text-xl mb-6">
                Competências Técnicas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {skills.map((skill, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-muted rounded-lg border border-border hover:border-primary/50 transition-colors"
                  >
                    <p className="font-accent text-foreground text-sm">
                      {skill}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Section */}
        <div className="max-w-4xl mx-auto mb-16">
          <h3 className="font-heading text-foreground text-2xl mb-12 text-center">
            Minha Trajetória
          </h3>
          <div className="space-y-6">
            {timeline.map((item, idx) => (
              <div key={idx} className="flex gap-6">
                {/* Timeline Dot and Line */}
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center text-xl font-bold">
                    {item.icon}
                  </div>
                  {idx < timeline.length - 1 && (
                    <div className="w-1 h-24 bg-gradient-to-b from-primary to-transparent mt-2" />
                  )}
                </div>

                {/* Content */}
                <div className="pb-6 flex-grow">
                  <p className="font-accent text-primary text-sm uppercase tracking-widest">
                    {item.year}
                  </p>
                  <h4 className="font-heading text-foreground text-lg mt-1">
                    {item.title}
                  </h4>
                  <p className="font-body text-muted-foreground text-sm">
                    {item.company}
                  </p>
                  <p className="font-body text-foreground mt-2">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Education & Certifications */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
          {/* Education */}
          <div>
            <h3 className="font-heading text-foreground text-xl mb-6 flex items-center gap-2">
              <Briefcase size={24} className="text-primary" />
              Formação
            </h3>
            <div className="space-y-4">
              <div className="pb-4 border-b border-border">
                <p className="font-accent text-foreground font-semibold">
                  Master em Big Data e Business Intelligence
                </p>
                <p className="font-body text-sm text-muted-foreground">
                  European Business School of Barcelona
                </p>
              </div>
              <div className="pb-4 border-b border-border">
                <p className="font-accent text-foreground font-semibold">
                  Pós-graduação em Engenharia de Dados
                </p>
                <p className="font-body text-sm text-muted-foreground">
                  Integrated Colleges North of Paraná
                </p>
              </div>
              <div>
                <p className="font-accent text-foreground font-semibold">
                  Graduação em Engenharia de Computação
                </p>
                <p className="font-body text-sm text-muted-foreground">
                  Universidade Estadual de Londrina
                </p>
              </div>
            </div>
          </div>

          {/* Certifications */}
          <div>
            <h3 className="font-heading text-foreground text-xl mb-6 flex items-center gap-2">
              <Award size={24} className="text-primary" />
              Certificações
            </h3>
            <div className="space-y-3">
              {certifications.map((cert, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-muted rounded-lg border border-border flex items-center gap-3"
                >
                  <span className="text-primary font-bold">✓</span>
                  <p className="font-body text-foreground text-sm">{cert}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
