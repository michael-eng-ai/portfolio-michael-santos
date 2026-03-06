import OpenAI from "openai";
import { writeFileSync } from "fs";

interface Article {
  id: number;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
  tags: string[];
  link: string;
  content: string;
  slug: string;
}

/**
 * Gera um artigo de blog automaticamente usando LLM
 * Conecta tendências atuais em dados, IA e tecnologia com engenharia de dados
 */
async function generateTodayArticle(): Promise<Article> {
  const openai = new OpenAI();

  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Temas já cobertos no blog (para evitar repetição)
  const topicosJaCobertos = [
    "Data Mesh", "Feature Store", "LLMOps", "Observabilidade de Dados",
    "ETL Inteligente", "Dados Sintéticos", "IA Agêntica", "Lakehouse",
    "Streaming em Tempo Real", "Apache Kafka", "Apache Flink",
    "Model Context Protocol", "Engenharia de Dados", "Data Fabric",
    "Vector Databases", "Edge AI", "AI Agents", "Semantic Layers",
    "AI-Ready Data", "Data Privacy", "LGPD"
  ];

  const prompt = `Você é um especialista em engenharia de dados, IA e tecnologia. Crie um artigo de blog em português brasileiro sobre uma tendência NOVA e ATUAL em dados, IA ou tecnologia para março de 2026.

IMPORTANTE: Escolha um tema que NÃO seja nenhum destes já cobertos: ${topicosJaCobertos.join(", ")}.

Sugestões de temas interessantes para março de 2026:
- Quantum Computing aplicado a dados e IA
- DataOps e DevDataOps: a nova fronteira da automação
- Arquitetura Kappa vs Lambda em 2026
- IA Multimodal e impacto na engenharia de dados
- Governança de IA (AI Governance) e compliance
- Computação de borda (Edge Computing) para pipelines de dados
- Plataformas de dados em tempo real (Real-Time Data Platforms)
- Engenharia de Prompts e RAG (Retrieval-Augmented Generation) para dados empresariais
- Databricks vs Snowflake: a batalha das plataformas de dados em 2026
- Privacidade diferencial e técnicas de anonimização avançadas
- Apache Iceberg e o futuro dos formatos de tabela aberta
- Custo de IA: como otimizar gastos com LLMs em produção

REQUISITOS:
- Mínimo de 800 palavras (idealmente 1000-1200 palavras)
- Conecte a tendência com engenharia de dados e aplicações práticas
- Tom profissional e estratégico, voltado para tomadores de decisão
- Inclua exemplos concretos, métricas e comparações quando possível
- Use markdown para formatação (títulos, listas, negrito, tabelas)
- Seja específico sobre o contexto de 2026 e o mercado brasileiro quando relevante

ESTRUTURA OBRIGATÓRIA:
1. Introdução impactante que contextualiza a tendência (com dados/estatísticas)
2. Explicação técnica mas acessível do conceito
3. Conexão direta com engenharia de dados e pipelines
4. Aplicações práticas e casos de uso reais (mínimo 3 exemplos)
5. Desafios, considerações e riscos
6. Conclusão com insights estratégicos e próximos passos

FORMATO DE RESPOSTA (JSON):
{
  "title": "Título atraente e específico (máximo 80 caracteres)",
  "excerpt": "Resumo de 2-3 frases que captura a essência do artigo (máximo 250 caracteres)",
  "category": "Categoria do artigo (ex: IA & Dados, Arquitetura de Dados, Cloud & Infraestrutura, DataOps)",
  "tags": ["Tag1", "Tag2", "Tag3"],
  "content": "Conteúdo completo do artigo em markdown com mínimo de 800 palavras"
}`;

  try {
    console.log("🤖 Gerando artigo com LLM...");

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "Você é um especialista em engenharia de dados e tecnologia que escreve artigos técnicos mas acessíveis para profissionais e tomadores de decisão. Você sempre gera conteúdo original, específico e com exemplos práticos reais.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.85,
      response_format: { type: "json_object" },
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error("Resposta vazia do LLM");
    }

    const articleData = JSON.parse(response);

    // Calcular tempo de leitura (assumindo 200 palavras por minuto)
    const wordCount = articleData.content.split(/\s+/).length;
    const readTime = Math.ceil(wordCount / 200);

    // Gerar slug único
    const slug = articleData.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // ID 71 (próximo após o último artigo id=70)
    const nextId = 71;

    const article: Article = {
      id: nextId,
      title: articleData.title,
      excerpt: articleData.excerpt,
      date: formattedDate,
      readTime: `${readTime} min`,
      category: articleData.category,
      tags: articleData.tags.slice(0, 3),
      link: `/blog/${slug}`,
      content: articleData.content,
      slug: slug,
    };

    console.log("✅ Artigo gerado com sucesso!");
    console.log(`📝 Título: ${article.title}`);
    console.log(`🏷️ Categoria: ${article.category}`);
    console.log(`⏱️ Tempo de leitura: ${article.readTime}`);
    console.log(`📊 Palavras: ${wordCount}`);
    console.log(`🔗 Slug: ${article.slug}`);

    // Salvar em arquivo JSON
    const outputPath = `article_2026_03_06_new.json`;
    writeFileSync(outputPath, JSON.stringify(article, null, 2), "utf-8");
    console.log(`💾 Artigo salvo em: ${outputPath}`);

    return article;
  } catch (error) {
    console.error("❌ Erro ao gerar artigo:", error);
    throw error;
  }
}

// Executar
generateTodayArticle()
  .then((article) => {
    console.log("\n📄 Artigo gerado:");
    console.log(JSON.stringify(article, null, 2));
  })
  .catch((error) => {
    console.error("Erro:", error);
    process.exit(1);
  });
