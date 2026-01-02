import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";

const faqs = [
  {
    id: 1,
    category: "Implementação",
    question: "Quanto tempo leva para implementar uma solução de dados?",
    answer:
      "Depende da complexidade do seu ambiente. Projetos simples (data warehouse) levam 2-3 meses. Arquiteturas complexas (real-time, múltiplas clouds) podem levar 6-12 meses. Sempre começamos com um diagnóstico de 2 semanas para entender sua situação específica.",
  },
  {
    id: 2,
    category: "Implementação",
    question: "Qual é o tamanho mínimo de dados para justificar uma solução?",
    answer:
      "Não é sobre volume, é sobre complexidade. Empresas com 100GB de dados bem estruturados precisam menos que empresas com 1TB espalhado em 20 sistemas diferentes. O que importa é: seus dados estão fragmentados? Você precisa de análises em tempo real? Tem múltiplas fontes? Se sim em qualquer um, vale a pena.",
  },
  {
    id: 3,
    category: "Custos",
    question: "Qual é o investimento típico?",
    answer:
      "Varia bastante. Pequenas implementações (BI + data warehouse) custam R$ 50k-150k. Arquiteturas enterprise (real-time, múltiplas clouds, governança) custam R$ 300k-1M+. Mas o ROI é tipicamente 3-5x em 12 meses. Sempre faço uma análise de custo-benefício antes de propor qualquer solução.",
  },
  {
    id: 4,
    category: "Custos",
    question: "Quanto custa manter a infraestrutura depois?",
    answer:
      "Custos operacionais variam de R$ 5k-50k/mês dependendo do volume de dados e complexidade. Mas com uma boa arquitetura, esses custos crescem muito mais lentamente que o volume de dados. Muitas empresas economizam 30-40% em custos de infraestrutura após otimização.",
  },
  {
    id: 5,
    category: "Timeline",
    question: "Qual é o timeline típico de um projeto?",
    answer:
      "Fase 1 (Diagnóstico): 2-4 semanas. Fase 2 (Design): 2-4 semanas. Fase 3 (Implementação): 8-16 semanas. Fase 4 (Otimização): 4-8 semanas. Total: 4-8 meses para um projeto típico. Projetos maiores podem levar 12+ meses.",
  },
  {
    id: 6,
    category: "Timeline",
    question: "Posso começar com uma solução MVP?",
    answer:
      "Sim! Recomendo sempre começar com um MVP (Minimum Viable Product). Implementamos uma solução simples em 4-6 semanas, validamos com usuários, e depois escalamos. Isso reduz risco e permite ajustes antes de investir em escala.",
  },
  {
    id: 7,
    category: "Tecnologia",
    question: "Qual tecnologia vocês recomendam?",
    answer:
      "Não recomendo tecnologia, recomendo solução. A tecnologia deve servir ao seu problema, não o contrário. Para a maioria das empresas: GCP BigQuery (simples, escalável), AWS Redshift (integração com AWS), ou Azure Synapse (integração com Microsoft). Para real-time: Kafka + Spark. Para BI: Looker, Tableau ou Power BI.",
  },
  {
    id: 8,
    category: "Tecnologia",
    question: "Precisamos migrar de nossa infraestrutura atual?",
    answer:
      "Nem sempre. Às vezes a solução é otimizar o que você tem. Outras vezes, migração é necessária. Faço uma análise técnica e financeira para determinar o melhor caminho. Quando migramos, fazemos de forma gradual para minimizar risco.",
  },
  {
    id: 9,
    category: "ROI",
    question: "Como vocês medem o sucesso?",
    answer:
      "Definimos KPIs claros no início: redução de tempo de análise, economia de custos, aumento de precisão, velocidade de insights. Rastreamos esses KPIs durante e após o projeto. Tipicamente, vemos 30-50% de melhoria em 6 meses.",
  },
  {
    id: 10,
    category: "ROI",
    question: "Qual é o típico ROI de um projeto de dados?",
    answer:
      "Varia, mas tipicamente: Economia de custos (30-40%), Aumento de receita (20-30%), Redução de risco (10-20%), Eficiência operacional (20-30%). Total: 3-5x ROI em 12 meses. Alguns clientes veem 10x+ em casos de fraude ou otimização de preços.",
  },
];

const categories = ["Implementação", "Custos", "Timeline", "Tecnologia", "ROI"];

export default function FAQ() {
  const { trackFAQExpand } = useAnalytics();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("Implementação");

  const filteredFaqs = faqs.filter((faq) => faq.category === selectedCategory);

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <p className="font-accent text-primary text-sm uppercase tracking-widest mb-3">
            Dúvidas Frequentes
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            FAQ - Perguntas Frequentes
          </h2>
          <p className="font-body text-lg text-muted-foreground">
            Respostas para as perguntas mais comuns sobre implementação, custos e ROI de projetos de dados.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-3 justify-center mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => {
                setSelectedCategory(category);
                setExpandedId(null);
              }}
              className={`px-6 py-2 rounded-full font-accent text-sm font-semibold transition-all ${
                selectedCategory === category
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground hover:bg-muted/80 border border-border"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto space-y-4">
          {filteredFaqs.map((faq) => (
            <div
              key={faq.id}
              className="border border-border rounded-lg overflow-hidden bg-card hover:border-primary/50 transition-colors"
            >
              <button
                onClick={() => {
                  const newId = expandedId === faq.id ? null : faq.id;
                  setExpandedId(newId);
                  if (newId) {
                    trackFAQExpand(faq.id, faq.category);
                  }
                }}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
              >
                <h3 className="font-accent text-foreground font-semibold text-left">
                  {faq.question}
                </h3>
                <ChevronDown
                  size={20}
                  className={`text-primary flex-shrink-0 transition-transform ${
                    expandedId === faq.id ? "rotate-180" : ""
                  }`}
                />
              </button>

              {expandedId === faq.id && (
                <div className="px-6 py-4 border-t border-border bg-muted/20">
                  <p className="font-body text-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <p className="font-body text-muted-foreground mb-6">
            Ainda tem dúvidas? Vamos conversar sobre seu caso específico.
          </p>
          <a
            href="#contact"
            className="inline-flex items-center justify-center px-8 py-3 bg-primary text-primary-foreground rounded-md font-accent hover:bg-primary/90 transition-colors"
          >
            Agendar Consulta
          </a>
        </div>
      </div>
    </section>
  );
}
