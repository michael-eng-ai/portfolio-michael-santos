import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
 * Tema: Agentes de IA Autônomos e Engenharia de Dados
 */
export async function generateArticle20260224(): Promise<Article> {
  const openai = new OpenAI();
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const prompt = `Você é um especialista em engenharia de dados, IA e tecnologia. Crie um artigo de blog em português brasileiro sobre o seguinte tema específico:

**TEMA OBRIGATÓRIO:** "Agentes de IA Autônomos: Como a Engenharia de Dados Viabiliza a Nova Geração de Sistemas Inteligentes"

O artigo deve abordar:
- O que são agentes de IA autônomos e como funcionam em 2026
- A diferença entre agentes reativos e agentes com memória e planejamento (ReAct, CoT, Tool Use)
- O papel crítico da engenharia de dados: pipelines de contexto, RAG avançado, memória vetorial
- Ferramentas e frameworks: LangGraph, AutoGen, CrewAI, Semantic Kernel
- Casos de uso reais: automação de processos, análise de dados autônoma, suporte ao cliente
- Desafios de infraestrutura: observabilidade, latência, custo, segurança
- O impacto nos times de engenharia de dados e as novas competências exigidas
- Métricas de sucesso para agentes em produção

REQUISITOS:
- Mínimo de 900 palavras
- Conecte a tendência com engenharia de dados e aplicações práticas
- Tom profissional e estratégico, voltado para tomadores de decisão e engenheiros
- Inclua exemplos concretos e métricas quando possível
- Use markdown para formatação (títulos H2 e H3, listas, negrito, tabelas, etc)
- NÃO escreva sobre Data Mesh, LLMOps ou Kafka/Flink (já cobertos em artigos anteriores)

ESTRUTURA:
1. Introdução impactante sobre a era dos agentes autônomos em 2026
2. O que são agentes de IA e seus componentes fundamentais
3. O papel essencial da engenharia de dados para agentes
4. Stack tecnológico e ferramentas líderes
5. Casos de uso práticos com métricas reais
6. Desafios estratégicos e como superá-los
7. Conclusão com visão de futuro e recomendações

FORMATO DE RESPOSTA (JSON):
{
  "title": "Título atraente e específico sobre Agentes de IA (máximo 80 caracteres)",
  "excerpt": "Resumo de 2-3 frases que captura a essência do artigo (máximo 200 caracteres)",
  "category": "IA & Dados",
  "tags": ["Agentes de IA", "Engenharia de Dados", "IA Generativa"],
  "content": "Conteúdo completo do artigo em markdown com no mínimo 900 palavras"
}`;

  try {
    console.log("🤖 Gerando artigo com LLM sobre Agentes de IA Autônomos...");
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "Você é um especialista em engenharia de dados e IA que escreve artigos técnicos mas acessíveis para profissionais e tomadores de decisão. Você escreve em português brasileiro com tom profissional e estratégico.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.75,
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

    const nextId = 56; // Próximo ID após o artigo 55

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

    // Salvar o artigo em arquivo JSON
    const outputPath = path.join(__dirname, "..", "article_2026_02_24.json");
    fs.writeFileSync(outputPath, JSON.stringify(article, null, 2), "utf-8");
    console.log(`💾 Artigo salvo em: ${outputPath}`);

    return article;
  } catch (error) {
    console.error("❌ Erro ao gerar artigo:", error);
    throw error;
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  generateArticle20260224()
    .then((article) => {
      console.log("\n📄 Artigo gerado:");
      console.log(JSON.stringify(article, null, 2));
    })
    .catch((error) => {
      console.error("Erro:", error);
      process.exit(1);
    });
}
