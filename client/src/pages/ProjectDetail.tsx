import { useLocation } from "wouter";
import { ArrowLeft, Calendar, Users, TrendingUp } from "lucide-react";
import { Link } from "wouter";

const projects = {
  "fraude-bancaria": {
    title: "Prevenção de Fraudes em Transações Bancárias",
    subtitle: "Arquitetura de Dados para Detecção em Tempo Real",
    date: "Outubro 2022 - Agosto 2023",
    company: "Act Digital",
    image: "/images/case-study-fraud-detection.jpg",
    challenge: `
O cliente, uma instituição financeira de grande porte, enfrentava um desafio crítico: **fraudes em transações não eram detectadas em tempo real**. O sistema legado processava dados em batch (uma vez por dia), o que significava que fraudes eram descobertas apenas 24 horas depois — tempo suficiente para que fraudadores aproveitassem a janela.

Além disso, o cliente tinha múltiplas fontes de dados (SQL Server, MongoDB, Oracle) que não se comunicavam, tornando impossível correlacionar padrões de fraude em tempo real.
    `,
    solution: `
Implementei uma **arquitetura de dados moderna** que integrou todas as fontes em um pipeline em tempo real:

1. **Ingestão em Tempo Real:** Usamos Kafka para capturar eventos de transação assim que ocorrem
2. **Processamento:** Azure Data Lake + Databricks para processar e enriquecer dados
3. **Detecção:** Modelos de machine learning que identificam padrões anômalos em milissegundos
4. **Ação:** Integração com sistemas de bloqueio automático para parar transações suspeitas

**Tecnologias:** Azure Data Lake, Databricks, Kafka, GCP, Oracle, Python, Machine Learning

**Resultado:** Sistema capaz de processar **1 milhão+ de transações por dia** com latência de **< 500ms**.
    `,
    impact: [
      "Redução de 45% em fraudes não detectadas",
      "Processamento de 1M+ transações/dia em tempo real",
      "ROI de 3x em 12 meses",
      "Economia de R$ 2.5M+ em perdas por fraude",
    ],
    learnings: `
Este projeto me ensinou que **dados em tempo real não são apenas sobre velocidade, mas sobre confiabilidade**. Um sistema que detecta fraude 99% das vezes é inútil se falha 1% das vezes (quando a fraude acontece). Por isso, implementamos redundância, fallbacks e monitoramento contínuo.

Também aprendi a importância de **comunicação com stakeholders não-técnicos**. O CFO não entende Kafka ou Databricks, mas entende "economia de R$ 2.5M". Sempre traduzo tecnologia em impacto de negócio.
    `,
  },
  "healthcare-insights": {
    title: "Otimização de Atendimento em Healthcare",
    subtitle: "Integração de Dados para Insights de Pacientes",
    date: "Agosto 2023 - Presente",
    company: "K2 Partnering Solutions",
    image: "/images/case-study-healthcare-insights.jpg",
    challenge: `
O cliente, uma plataforma de saúde digital, tinha dados espalhados em múltiplos sistemas: **CRM, chatbot, Watson Assistant, Sendbird** (mensagens), Google Analytics. Ninguém tinha uma visão completa da jornada do paciente.

Resultado: **oportunidades de melhoria eram invisíveis**. Não sabíamos por que pacientes abandonavam o atendimento, qual era o tempo médio de resposta, ou como melhorar a experiência.
    `,
    solution: `
Criei um **data lake unificado** que integrou todas as fontes:

1. **Ingestão:** Pipelines no GCP (Cloud Functions, Cloud Storage) e AWS (Lambda, S3) para capturar dados de todas as plataformas
2. **Transformação:** BigQuery para consolidar e enriquecer dados
3. **Visualização:** Qlik Sense para criar dashboards que mostram a jornada completa do paciente
4. **Insights:** Análises que identificam gargalos e oportunidades

**Tecnologias:** GCP (BigQuery, Cloud Functions, Google Analytics), AWS (Lambda, S3), Qlik Sense, CRM, Chatbot, Watson

**Resultado:** Dashboard em tempo real que mostra **jornada completa do paciente** com métricas de satisfação, tempo de resposta e taxa de conclusão.
    `,
    impact: [
      "Aumento de 38% na satisfação do cliente",
      "Redução de 25% no tempo de resposta",
      "Insights acionáveis em <24h",
      "Melhoria de 22% na taxa de conclusão de atendimentos",
    ],
    learnings: `
Este projeto mostrou que **dados não são sobre quantidade, mas sobre qualidade e contexto**. Tínhamos bilhões de eventos, mas a maioria era ruído. O verdadeiro valor veio de **correlacionar dados** de múltiplas fontes para entender o comportamento do paciente.

Também aprendi sobre **compliance em healthcare**. Dados de saúde são sensíveis. Implementamos criptografia, auditoria e governança rigorosa para garantir que dados de pacientes fossem protegidos.
    `,
  },
  "automacao-financeira": {
    title: "Automação de Processos Financeiros",
    subtitle: "ETL Pipeline para Eficiência Operacional",
    date: "Dezembro 2021 - Outubro 2022",
    company: "Art It",
    image: "/images/case-study-automation-efficiency.jpg",
    challenge: `
O cliente, uma companhia aérea, tinha um processo manual de geração de relatórios financeiros e regulatórios. **Cada relatório levava 3-4 dias para ser gerado**, envolvia múltiplas pessoas e tinha uma taxa de erro de ~5%.

Além disso, dados estavam em SAP (sistema financeiro) e GCP (data warehouse), e ninguém tinha uma visão unificada.
    `,
    solution: `
Implementei uma **automação completa** usando Airflow:

1. **Extração:** Pipelines que extraem dados de SAP e GCP automaticamente
2. **Transformação:** Lógica de negócio implementada em Python para calcular métricas financeiras
3. **Orquestração:** Airflow (AWS) e Composer (GCP) para orquestrar todo o processo
4. **Entrega:** Relatórios gerados automaticamente e enviados para stakeholders

**Tecnologias:** AWS (Airflow, S3, Lambda, EC2), GCP (Composer), Docker, Python, SAP, MongoDB

**Resultado:** Processo que levava **3-4 dias agora leva < 2 horas**, com **zero erros manuais**.
    `,
    impact: [
      "Redução de 60% em tempo manual de processamento",
      "Eliminação de 95% de erros manuais",
      "Economia de R$ 500k+ anuais em horas de trabalho",
      "Compliance 100% com regulamentações",
    ],
    learnings: `
Este projeto me ensinou que **automação é sobre eliminar fricção, não apenas velocidade**. O verdadeiro valor não era apenas processar relatórios mais rápido, mas **liberar pessoas** para trabalhar em coisas mais estratégicas.

Também aprendi sobre **orquestração em ambientes multi-cloud**. Usar Airflow na AWS e Composer no GCP simultaneamente foi desafiador, mas mostrou que é possível construir soluções agnósticas de cloud.
    `,
  },
};

export default function ProjectDetail() {
  const [location] = useLocation();
  const projectId = location.split("/").pop();
  const project = projects[projectId as keyof typeof projects];

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-foreground mb-4">Projeto não encontrado</h1>
          <Link href="/">
            <a className="inline-flex items-center text-primary font-accent hover:gap-2 transition-all group">
              <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" />
              Voltar para Home
            </a>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Link href="/">
            <a className="inline-flex items-center text-primary font-accent text-sm hover:gap-1 transition-all group">
              <ArrowLeft size={16} className="mr-1 group-hover:-translate-x-1 transition-transform" />
              Voltar
            </a>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div
        className="relative h-96 bg-cover bg-center"
        style={{
          backgroundImage: `url('${project.image}')`,
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative h-full flex items-end">
          <div className="container mx-auto px-4 pb-12">
            <p className="font-accent text-primary/80 text-sm uppercase tracking-widest mb-2">
              Case de Sucesso
            </p>
            <h1 className="font-display text-white mb-4">
              {project.title}
            </h1>
            <p className="font-body text-white/90 max-w-2xl">
              {project.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <article className="py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Meta */}
          <div className="grid grid-cols-3 gap-6 mb-12 pb-12 border-b border-border">
            <div>
              <p className="font-accent text-muted-foreground text-xs uppercase mb-2">
                Período
              </p>
              <p className="font-body text-foreground">{project.date}</p>
            </div>
            <div>
              <p className="font-accent text-muted-foreground text-xs uppercase mb-2">
                Empresa
              </p>
              <p className="font-body text-foreground">{project.company}</p>
            </div>
            <div>
              <p className="font-accent text-muted-foreground text-xs uppercase mb-2">
                Impacto
              </p>
              <p className="font-body text-foreground">ROI 3x+</p>
            </div>
          </div>

          {/* Challenge */}
          <section className="mb-12">
            <h2 className="font-heading text-foreground mb-4">O Desafio</h2>
            <div className="font-body text-foreground leading-relaxed space-y-4">
              {project.challenge.split("\n\n").map((paragraph, idx) => (
                <p key={idx}>{paragraph.trim()}</p>
              ))}
            </div>
          </section>

          {/* Solution */}
          <section className="mb-12">
            <h2 className="font-heading text-foreground mb-4">A Solução</h2>
            <div className="font-body text-foreground leading-relaxed space-y-4">
              {project.solution.split("\n\n").map((paragraph, idx) => (
                <p key={idx}>{paragraph.trim()}</p>
              ))}
            </div>
          </section>

          {/* Impact */}
          <section className="mb-12 bg-muted/30 rounded-lg p-8">
            <h2 className="font-heading text-foreground mb-6 flex items-center gap-2">
              <TrendingUp className="text-primary" />
              Impacto Mensurável
            </h2>
            <ul className="space-y-3">
              {project.impact.map((item, idx) => (
                <li key={idx} className="font-body text-foreground flex items-start gap-3">
                  <span className="text-primary font-bold">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* Learnings */}
          <section className="mb-12">
            <h2 className="font-heading text-foreground mb-4">Aprendizados</h2>
            <div className="font-body text-foreground leading-relaxed space-y-4">
              {project.learnings.split("\n\n").map((paragraph, idx) => (
                <p key={idx}>{paragraph.trim()}</p>
              ))}
            </div>
          </section>

          {/* Divider */}
          <div className="border-t border-border my-12" />

          {/* CTA */}
          <div className="bg-muted/30 rounded-lg p-8 text-center">
            <h3 className="font-heading text-foreground mb-3">
              Seu projeto pode ter resultados similares
            </h3>
            <p className="font-body text-muted-foreground mb-6">
              Se você enfrenta desafios similares, vamos conversar sobre como implementar uma solução que gere impacto real.
            </p>
            <a
              href="/#contact"
              className="inline-flex items-center justify-center px-8 py-3 bg-primary text-primary-foreground rounded-md font-accent hover:bg-primary/90 transition-colors"
            >
              Agendar Consulta
            </a>
          </div>
        </div>
      </article>
    </div>
  );
}
