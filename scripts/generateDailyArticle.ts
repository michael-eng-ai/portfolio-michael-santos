import OpenAI from "openai";
import { nanoid } from "nanoid";

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
export async function generateDailyArticle(): Promise<Article> {
  const openai = new OpenAI();

  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Prompt para gerar o artigo
  const prompt = `Você é um especialista em engenharia de dados, IA e tecnologia. Crie um artigo de blog em português brasileiro sobre uma tendência atual em dados, IA ou tecnologia.

REQUISITOS:
- Mínimo de 800 palavras
- Conecte a tendência com engenharia de dados e aplicações práticas
- Tom profissional e estratégico, voltado para tomadores de decisão
- Inclua exemplos concretos e métricas quando possível
- Use markdown para formatação (títulos, listas, negrito, etc)

ESTRUTURA:
1. Introdução impactante que contextualiza a tendência
2. Explicação técnica mas acessível do conceito
3. Conexão com engenharia de dados
4. Aplicações práticas e casos de uso
5. Desafios e considerações
6. Conclusão com insights estratégicos

FORMATO DE RESPOSTA (JSON):
{
  "title": "Título atraente e específico (máximo 80 caracteres)",
  "excerpt": "Resumo de 2-3 frases que captura a essência do artigo (máximo 200 caracteres)",
  "category": "Categoria do artigo (ex: IA & Dados, Arquitetura de Dados, Cloud & Infraestrutura)",
  "tags": ["Tag1", "Tag2", "Tag3"],
  "content": "Conteúdo completo do artigo em markdown"
}

Gere um artigo sobre uma tendência relevante e atual em ${currentDate.getFullYear()}.`;

  try {
    console.log("🤖 Gerando artigo com LLM...");

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "Você é um especialista em engenharia de dados e tecnologia que escreve artigos técnicos mas acessíveis para profissionais e tomadores de decisão.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.8,
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

    // Obter o próximo ID (em produção, isso viria do banco de dados)
    const nextId = Date.now() % 10000; // ID temporário baseado em timestamp

    const article: Article = {
      id: nextId,
      title: articleData.title,
      excerpt: articleData.excerpt,
      date: formattedDate,
      readTime: `${readTime} min`,
      category: articleData.category,
      tags: articleData.tags.slice(0, 3), // Máximo 3 tags
      link: `/blog/${slug}`,
      content: articleData.content,
      slug: slug,
    };

    console.log("✅ Artigo gerado com sucesso!");
    console.log(`📝 Título: ${article.title}`);
    console.log(`🏷️ Categoria: ${article.category}`);
    console.log(`⏱️ Tempo de leitura: ${article.readTime}`);
    console.log(`📊 Palavras: ${wordCount}`);

    return article;
  } catch (error) {
    console.error("❌ Erro ao gerar artigo:", error);
    throw error;
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  generateDailyArticle()
    .then((article) => {
      console.log("\n📄 Artigo gerado:");
      console.log(JSON.stringify(article, null, 2));
    })
    .catch((error) => {
      console.error("Erro:", error);
      process.exit(1);
    });
}
