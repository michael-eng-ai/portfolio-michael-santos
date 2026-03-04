#!/usr/bin/env python3
"""
Script para executar a função generateDailyArticle() e salvar o resultado.
Equivalente ao script TypeScript generateDailyArticle.ts
"""

import os
import json
import re
from datetime import datetime
from openai import OpenAI

def generate_daily_article():
    client = OpenAI()
    
    current_date = datetime.now()
    
    # Formatar data em português brasileiro
    months = {
        1: "janeiro", 2: "fevereiro", 3: "março", 4: "abril",
        5: "maio", 6: "junho", 7: "julho", 8: "agosto",
        9: "setembro", 10: "outubro", 11: "novembro", 12: "dezembro"
    }
    formatted_date = f"{current_date.day} de {months[current_date.month]} de {current_date.year}"
    
    prompt = f"""Você é um especialista em engenharia de dados, IA e tecnologia. Crie um artigo de blog em português brasileiro sobre uma tendência atual em dados, IA ou tecnologia.

REQUISITOS:
- Mínimo de 800 palavras
- Conecte a tendência com engenharia de dados e aplicações práticas
- Tom profissional e estratégico, voltado para tomadores de decisão
- Inclua exemplos concretos e métricas quando possível
- Use markdown para formatação (títulos, listas, negrito, etc)
- Escolha um tema diferente dos seguintes (já publicados): Data Mesh, ETL Inteligente, Observabilidade de Dados, Confluent Intelligence/Streaming, Pipelines Tradicionais vs IA

ESTRUTURA:
1. Introdução impactante que contextualiza a tendência
2. Explicação técnica mas acessível do conceito
3. Conexão com engenharia de dados
4. Aplicações práticas e casos de uso
5. Desafios e considerações
6. Conclusão com insights estratégicos

FORMATO DE RESPOSTA (JSON):
{{
  "title": "Título atraente e específico (máximo 80 caracteres)",
  "excerpt": "Resumo de 2-3 frases que captura a essência do artigo (máximo 200 caracteres)",
  "category": "Categoria do artigo (ex: IA & Dados, Arquitetura de Dados, Cloud & Infraestrutura, Engenharia de Dados)",
  "tags": ["Tag1", "Tag2", "Tag3"],
  "content": "Conteúdo completo do artigo em markdown"
}}

Gere um artigo sobre uma tendência relevante e atual em {current_date.year}. Foque em temas como: LLMOps, Feature Stores, Data Contracts, Iceberg/Delta Lake, AI Governance, Real-time Analytics, ou outro tema relevante que ainda não foi coberto."""

    print("🤖 Gerando artigo com LLM...")
    
    completion = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {
                "role": "system",
                "content": "Você é um especialista em engenharia de dados e tecnologia que escreve artigos técnicos mas acessíveis para profissionais e tomadores de decisão."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.8,
        response_format={"type": "json_object"}
    )
    
    response = completion.choices[0].message.content
    if not response:
        raise Exception("Resposta vazia do LLM")
    
    article_data = json.loads(response)
    
    # Calcular tempo de leitura (200 palavras por minuto)
    word_count = len(article_data["content"].split())
    read_time = max(1, round(word_count / 200))
    
    # Gerar slug único
    import unicodedata
    slug = article_data["title"].lower()
    slug = unicodedata.normalize("NFD", slug)
    slug = "".join(c for c in slug if unicodedata.category(c) != "Mn")
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    slug = slug.strip("-")
    
    # Obter próximo ID (baseado nos artigos existentes no Blog.tsx)
    next_id = 67  # O último artigo tem id=66
    
    article = {
        "id": next_id,
        "title": article_data["title"],
        "excerpt": article_data["excerpt"],
        "date": formatted_date,
        "readTime": f"{read_time} min",
        "category": article_data["category"],
        "tags": article_data["tags"][:3],
        "link": f"/blog/{slug}",
        "content": article_data["content"],
        "slug": slug
    }
    
    print(f"✅ Artigo gerado com sucesso!")
    print(f"📝 Título: {article['title']}")
    print(f"🏷️ Categoria: {article['category']}")
    print(f"⏱️ Tempo de leitura: {article['readTime']}")
    print(f"📊 Palavras: {word_count}")
    print(f"🔗 Slug: {article['slug']}")
    
    return article

if __name__ == "__main__":
    article = generate_daily_article()
    
    # Salvar o artigo gerado
    date_str = datetime.now().strftime("%Y_%m_%d")
    output_file = f"/home/ubuntu/portfolio-michael-santos/article_{date_str}_new.json"
    
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(article, f, ensure_ascii=False, indent=2)
    
    print(f"\n💾 Artigo salvo em: {output_file}")
    print("\n📄 Preview do artigo:")
    print(f"ID: {article['id']}")
    print(f"Título: {article['title']}")
    print(f"Excerpt: {article['excerpt']}")
    print(f"Data: {article['date']}")
    print(f"Tags: {', '.join(article['tags'])}")
