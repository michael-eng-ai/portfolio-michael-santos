import OpenAI from "openai";

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
 * Tema: LLMs em Produção e Engenharia de Dados para IA
 */
export async function generateArticleToday(): Promise<Article> {
  const openai = new OpenAI();

  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const prompt = `Você é um especialista em engenharia de dados, IA e tecnologia. Crie um artigo de blog em português brasileiro sobre o seguinte tema específico:

**TEMA OBRIGATÓRIO:** "LLMOps: A Nova Disciplina de Engenharia de Dados para Colocar Modelos de Linguagem em Produção"

O artigo deve abordar:
- O que é LLMOps e como difere de MLOps tradicional
- Pipelines de dados para fine-tuning e RAG (Retrieval-Augmented Generation)
- Desafios de infraestrutura: latência, custos, escalabilidade
- Ferramentas como LangChain, LlamaIndex, Weights & Biases, MLflow
- Casos de uso reais em empresas brasileiras e globais
- O papel do engenheiro de dados nesse novo cenário
- Métricas e observabilidade para LLMs em produção

REQUISITOS:
- Mínimo de 900 palavras
- Conecte a tendência com engenharia de dados e aplicações práticas
- Tom profissional e estratégico, voltado para tomadores de decisão e engenheiros
- Inclua exemplos concretos e métricas quando possível
- Use markdown para formatação (títulos H2 e H3, listas, negrito, etc)
- NÃO escreva sobre Data Mesh

ESTRUTURA:
1. Introdução impactante que contextualiza LLMOps em 2026
2. O que é LLMOps e seus pilares
3. Conexão com engenharia de dados: pipelines, RAG, fine-tuning
4. Ferramentas e stack tecnológico
5. Casos de uso práticos e métricas
6. Desafios e considerações estratégicas
7. Conclusão com insights para 2026

FORMATO DE RESPOSTA (JSON):
{
  "title": "Título atraente e específico sobre LLMOps (máximo 80 caracteres)",
  "excerpt": "Resumo de 2-3 frases que captura a essência do artigo (máximo 200 caracteres)",
  "category": "IA & Dados",
  "tags": ["LLMOps", "Engenharia de Dados", "IA Generativa"],
  "content": "Conteúdo completo do artigo em markdown com no mínimo 900 palavras"
}`;

  try {
    console.log("🤖 Gerando artigo com LLM sobre LLMOps...");

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "Você é um especialista em engenharia de dados e LLMOps que escreve artigos técnicos mas acessíveis para profissionais e tomadores de decisão. Você NUNCA escreve sobre Data Mesh.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
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

    const nextId = 55; // Próximo ID após o artigo 54

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

    return article;
  } catch (error) {
    console.error("❌ Erro ao gerar artigo:", error);
    throw error;
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  generateArticleToday()
    .then((article) => {
      console.log("\n📄 Artigo gerado:");
      console.log(JSON.stringify(article, null, 2));
    })
    .catch((error) => {
      console.error("Erro:", error);
      process.exit(1);
    });
}
