# Portfolio Michael Santos - Data Engineering & Strategic Consulting

Um site portfólio profissional e elegante que funciona como ferramenta de marketing para consultoria em engenharia de dados.

## 🎯 Objetivo

Posicionar Michael Santos como especialista em engenharia de dados e consultoria estratégica, atraindo tanto recrutadores quanto empresários internacionais. O site apresenta projetos como produtos/serviços, conectando tendências de dados com aplicações práticas.

## 🚀 Features

- **Hero Section**: Proposta de valor impactante com estatísticas
- **3 Cases de Sucesso**: Projetos detalhados com desafios, soluções e métricas de impacto
- **6 Serviços de Consultoria**: Soluções escaláveis e versáteis
- **14 Artigos de Blog**: Tendências em dados, IA e transformação digital
- **Geração Automática de Artigos**: Script com LLM para criar conteúdo original
- **3 Depoimentos de Clientes**: Feedback de parceiros e empresas
- **Newsletter**: Guia gratuito "10 Passos para Implementar Dados Estratégicos"
- **FAQ Interativa**: 10 perguntas em 5 categorias com accordion
- **Calendly Integrado**: Agendamento direto de consultas
- **Analytics Avançado**: Rastreamento de eventos (cliques, signups, submissões)
- **Timeline de Carreira**: Evolução profissional com ícones visuais
- **Design Premium**: Tipografia elegante (Playfair Display, Montserrat), cores sofisticadas

## 🛠️ Stack Tecnológico

- **Frontend**: React 19 + TypeScript + Tailwind CSS 4
- **Roteamento**: Wouter (client-side routing)
- **Componentes UI**: shadcn/ui
- **Markdown**: Componente customizado MarkdownRenderer
- **Analytics**: Umami Analytics
- **Agendamento**: Calendly Widget
- **Build Tool**: Vite
- **Package Manager**: pnpm

## 📁 Estrutura do Projeto

```
portfolio-michael-santos/
├── client/
│   ├── public/
│   │   └── images/          # Imagens geradas (hero, cases, etc)
│   ├── src/
│   │   ├── components/      # Componentes reutilizáveis
│   │   │   ├── Header.tsx
│   │   │   ├── Hero.tsx
│   │   │   ├── Projects.tsx
│   │   │   ├── Services.tsx
│   │   │   ├── Blog.tsx
│   │   │   ├── Testimonials.tsx
│   │   │   ├── Newsletter.tsx
│   │   │   ├── FAQ.tsx
│   │   │   ├── About.tsx
│   │   │   ├── CalendlyWidget.tsx
│   │   │   ├── Contact.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── MarkdownRenderer.tsx
│   │   │   └── ui/          # shadcn/ui components
│   │   ├── pages/
│   │   │   ├── Home.tsx     # Página principal
│   │   │   ├── BlogArticle.tsx  # Detalhe de artigos
│   │   │   ├── ProjectDetail.tsx # Detalhe de projetos
│   │   │   └── NotFound.tsx
│   │   ├── hooks/
│   │   │   └── useAnalytics.ts  # Hook customizado para analytics
│   │   ├── contexts/
│   │   │   └── ThemeContext.tsx
│   │   ├── lib/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css        # Estilos globais + design tokens
│   └── index.html
├── server/
│   └── index.ts             # Servidor Express (placeholder)
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🎨 Design Philosophy

**Premium Enterprise Consultant**: Design sofisticado que transmite confiança e expertise estratégica.

- **Tipografia**: Playfair Display (títulos) + Montserrat (corpo) + Inter (UI)
- **Cores**: Azul-marinho (#1e3a5f), Teal (#0d9488), Ouro suave (#f59e0b)
- **Espaçamento**: Whitespace generoso para elegância
- **Animações**: Transições suaves e micro-interações refinadas

## 🚀 Como Usar

### Instalação

```bash
# Instalar dependências
pnpm install

# Iniciar servidor de desenvolvimento
pnpm dev

# Build para produção
pnpm build

# Preview da build
pnpm preview
```

### Variáveis de Ambiente

O projeto usa variáveis injetadas automaticamente pelo Manus:
- `VITE_ANALYTICS_ENDPOINT`
- `VITE_ANALYTICS_WEBSITE_ID`
- `VITE_APP_ID`
- `VITE_APP_TITLE`

### Gerar Artigo de Blog Automaticamente

O projeto inclui um script que usa LLM para gerar artigos automaticamente sobre tendências em dados, IA e tecnologia:

```bash
# Gerar novo artigo
npx tsx scripts/generateDailyArticle.ts
```

O script:
- Usa OpenAI (gpt-4.1-mini) para gerar conteúdo original
- Cria artigos de mínimo 800 palavras em português brasileiro
- Conecta tendências com engenharia de dados e aplicações práticas
- Calcula automaticamente tempo de leitura
- Gera slug único para roteamento
- Retorna JSON pronto para integração

### Adicionar Novo Artigo de Blog Manualmente

1. Adicione o artigo ao objeto `articles` em `client/src/pages/BlogArticle.tsx`
2. Atualize o array `blogArticles` em `client/src/components/Blog.tsx`
3. O roteamento funciona automaticamente via slug

### Adicionar Novo Projeto/Case

1. Adicione o projeto ao objeto `projects` em `client/src/pages/ProjectDetail.tsx`
2. Atualize o array `projects` em `client/src/components/Projects.tsx`
3. O roteamento funciona automaticamente via slug

## 📊 Analytics

O site rastreia os seguintes eventos via Umami Analytics:

- `page_view`: Visualização de página
- `article_click`: Clique em artigo de blog
- `project_click`: Clique em case de sucesso
- `service_click`: Clique em serviço
- `newsletter_signup`: Inscrição em newsletter
- `contact_form_submit`: Submissão de formulário de contato
- `calendly_open`: Abertura de calendário
- `faq_expand`: Expansão de pergunta na FAQ

Acesse o dashboard do Umami para visualizar métricas em tempo real.

## 🔄 Fluxo de Conversão

1. **Visitante chega** → Hero impactante + CTA "Ver Projetos"
2. **Explora projetos** → 3 cases de sucesso com métricas
3. **Descobre serviços** → 6 soluções de consultoria
4. **Lê blog** → 12 artigos sobre tendências
5. **Vê depoimentos** → Credibilidade de clientes
6. **Inscreve em newsletter** → Guia gratuito
7. **Lê FAQ** → Responde dúvidas comuns
8. **Agenda consulta** → Calendly ou formulário de contato

## 📱 Responsividade

O site é totalmente responsivo:
- Mobile first design
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Testado em Chrome, Firefox, Safari, Edge

## 🔐 Segurança

- Sem dados sensíveis no código
- Variáveis de ambiente para secrets
- CSRF protection no formulário de contato
- Rate limiting recomendado no backend

## 📈 Próximas Melhorias

- [ ] Integração com Slack/Email para notificações
- [ ] Página de recursos/downloads com whitepapers
- [ ] Chat de IA para suporte automático
- [ ] Dark mode toggle
- [ ] Internacionalização (EN, ES, PT)
- [ ] Blog com CMS integrado
- [ ] Integração com GitHub para mostrar repositórios

## 📄 Licença

MIT

## 👤 Autor

**Michael Santos**
- Email: eng.michaelbarbosa@hotmail.com
- LinkedIn: [michael-bs](https://www.linkedin.com/in/michael-bs/)
- Empresa: Datasanti Consultoria

---

**Desenvolvido com ❤️ usando React, TypeScript e Tailwind CSS**
