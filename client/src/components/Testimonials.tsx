import { Star } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Carlos Mendes",
    company: "Act Digital",
    role: "VP de Operações",
    content:
      "Michael transformou completamente nossa arquitetura de dados. Em 6 meses, reduzimos custos de infraestrutura em 40% e aumentamos a velocidade de análise em 10x. Ele não apenas entrega soluções técnicas, mas entende o negócio.",
    rating: 5,
  },
  {
    id: 2,
    name: "Ana Silva",
    company: "K2 Partnering Solutions",
    role: "Diretora de Produto",
    content:
      "Trabalhar com Michael foi transformador. Ele criou uma arquitetura de dados que nos permitiu escalar de 100k para 10M de eventos/dia sem aumentar custos. Sua capacidade de traduzir dados em insights de negócio é rara.",
    rating: 5,
  },
  {
    id: 3,
    name: "Roberto Costa",
    company: "Datasanti",
    role: "CEO",
    content:
      "Michael é um dos melhores engenheiros de dados que já trabalhei. Sua expertise em arquitetura escalável e sua capacidade de comunicar com stakeholders não-técnicos o torna um consultor estratégico, não apenas técnico.",
    rating: 5,
  },
];

export default function Testimonials() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <p className="font-accent text-primary text-sm uppercase tracking-widest mb-3">
            O Que Clientes Dizem
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Depoimentos de Parceiros
          </h2>
          <p className="font-body text-muted-foreground text-lg">
            Empresas que confiaram em minha expertise para transformar seus dados em vantagem competitiva.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-card border border-border rounded-lg p-8 hover:shadow-lg transition-shadow duration-300 flex flex-col"
            >
              {/* Border Left Accent */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-primary/50 rounded-l-lg" />

              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className="fill-primary text-primary"
                  />
                ))}
              </div>

              {/* Content */}
              <p className="font-body text-foreground leading-relaxed mb-6 flex-grow">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="border-t border-border pt-4">
                <p className="font-accent font-semibold text-foreground">
                  {testimonial.name}
                </p>
                <p className="font-body text-sm text-muted-foreground">
                  {testimonial.role} • {testimonial.company}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
