import { CheckCircle2 } from "lucide-react";

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

export default function About() {
  return (
    <section id="about" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8">
            <div>
              <p className="font-accent text-primary text-sm uppercase tracking-widest mb-2">
                Sobre Mim
              </p>
              <h2 className="font-display text-foreground mb-4">
                Engenheiro de Dados com Visão Estratégica
              </h2>
            </div>

            <p className="font-body text-lg text-muted-foreground">
              Sou um Data Engineer com mais de 5 anos de experiência transformando dados brutos em decisões estratégicas. Minha trajetória combina expertise técnica profunda com visão de negócio aguçada.
            </p>

            <p className="font-body text-muted-foreground">
              Comecei como Data Analyst, evoluí para Business Intelligence e agora atuo como Data Engineer estratégico. Essa jornada me deu uma perspectiva única: entendo tanto a complexidade técnica quanto o impacto no negócio.
            </p>

            {/* Soft Skills */}
            <div className="space-y-4">
              <h3 className="font-heading text-foreground">
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
              <h3 className="font-heading text-foreground mb-6">
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

            {/* Education */}
            <div>
              <h3 className="font-heading text-foreground mb-4">
                Formação
              </h3>
              <div className="space-y-4">
                <div className="pb-4 border-b border-border">
                  <p className="font-accent text-foreground">
                    Master em Big Data e Business Intelligence
                  </p>
                  <p className="font-body text-sm text-muted-foreground">
                    European Business School of Barcelona
                  </p>
                </div>
                <div className="pb-4 border-b border-border">
                  <p className="font-accent text-foreground">
                    Pós-graduação em Engenharia de Dados
                  </p>
                  <p className="font-body text-sm text-muted-foreground">
                    Integrated Colleges North of Paraná
                  </p>
                </div>
                <div>
                  <p className="font-accent text-foreground">
                    Certificações: Azure, AWS, GCP
                  </p>
                  <p className="font-body text-sm text-muted-foreground">
                    Cloud Practitioner Certified
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
