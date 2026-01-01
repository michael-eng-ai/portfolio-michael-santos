import { ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-background">
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/images/hero-data-strategy.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center right",
          opacity: 0.15,
        }}
      />

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text */}
          <div className="space-y-6">
            <div className="space-y-4">
              <p className="font-accent text-primary text-sm uppercase tracking-widest">
                Engenharia de Dados • Consultoria Estratégica
              </p>
              <h1 className="font-display text-foreground leading-tight">
                Transformo Dados em Decisões Estratégicas
              </h1>
              <p className="font-body text-lg text-muted-foreground max-w-lg">
                Soluções escaláveis de Big Data que geram crescimento e eficiência para o seu negócio. Arquiteturas modernas, resultados mensuráveis.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <a
                href="#projects"
                className="inline-flex items-center justify-center px-8 py-3 bg-primary text-primary-foreground rounded-md font-accent hover:bg-primary/90 transition-colors group"
              >
                Ver Projetos
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
              </a>
              <a
                href="#contact"
                className="inline-flex items-center justify-center px-8 py-3 border-2 border-primary text-primary rounded-md font-accent hover:bg-primary/5 transition-colors"
              >
                Conversar Agora
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-border">
              <div>
                <p className="font-display text-2xl text-primary">5+</p>
                <p className="font-accent text-sm text-muted-foreground">Anos de Experiência</p>
              </div>
              <div>
                <p className="font-display text-2xl text-primary">20+</p>
                <p className="font-accent text-sm text-muted-foreground">Projetos Entregues</p>
              </div>
              <div>
                <p className="font-display text-2xl text-primary">3</p>
                <p className="font-accent text-sm text-muted-foreground">Clouds (GCP, AWS, Azure)</p>
              </div>
            </div>
          </div>

          {/* Right Column - Visual */}
          <div className="hidden lg:block relative h-96">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/20 mb-4">
                  <div className="w-16 h-16 rounded-full bg-primary/30 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-primary animate-pulse" />
                  </div>
                </div>
                <p className="font-accent text-sm text-muted-foreground">Arquitetura de Dados</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
