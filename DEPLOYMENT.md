# Deployment Guide

## Recommended Path

Use `Vercel` for production hosting and connect `michael.business` from GoDaddy after the first successful deploy.

This repository now runs as a `Next.js` content platform, which makes Vercel a strong default for routing, SEO outputs, previews, and custom domain handoff.

## What Is Already Configured

- `.github/workflows/ci.yml` for install, content validation, type check, and build
- `.github/workflows/news-auto-publish.yml` for automatic RSS news publication to `main`
- `.github/workflows/content-pipeline.yml` for scheduled GitHub sync and LinkedIn draft generation via pull request
- `.github/workflows/deploy-vercel.yml` for optional manual deploys through GitHub Actions
- `app/sitemap.ts`, `app/robots.ts`, and `app/feed.xml/route.ts` for SEO outputs

## Required GitHub Secrets

Set these repository secrets only if you want to keep the manual GitHub Actions deploy workflow available:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Optional but recommended:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `NEWSLETTER_FROM_EMAIL`
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- `OPENAI_API_KEY`
- `LINKEDIN_ACCESS_TOKEN`
- `LINKEDIN_PERSON_URN`
- `LINKEDIN_PUBLISH_SECRET`

## First-Time Vercel Setup

### 1. Create the Vercel project
- Import the `portfolio-michael-santos` repository into Vercel
- Let Vercel detect `Next.js` automatically

### 2. Capture project identifiers
- Run `vercel link` locally if needed
- Use the generated `.vercel/project.json` values to populate:
  - `VERCEL_ORG_ID`
  - `VERCEL_PROJECT_ID`

### 3. Connect the repository to Vercel
- Use the Vercel Git integration for automatic production deploys on `main`
- Keep `.github/workflows/deploy-vercel.yml` only as a manual fallback

### 4. Push to `main`
- The CI workflow validates the project
- Vercel publishes the production build automatically through the Git integration

## Content Automation Setup

### Automatic news publication
- `.github/workflows/news-auto-publish.yml` runs `pnpm content:sync:news` every 6 hours
- If `content/generated/news.json` changes, the workflow opens or updates an automation PR
- After merge, Vercel deploys the refreshed news automatically from `main`

### GitHub sync and LinkedIn drafts
- The scheduled workflow runs `pnpm content:sync:github`
- It then runs `pnpm content:linkedin`
- If outputs change, the workflow opens a pull request automatically

### Newsletter backend
- Create the subscriber table using `supabase/newsletter_subscribers.sql`
- Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Add Resend credentials if you want welcome emails enabled

### Google Analytics 4
- Create a GA4 Web Data Stream for `michael.business`
- Copy the Measurement ID, which looks like `G-XXXXXXXXXX`
- Add it to Vercel as `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- Redeploy or push a new commit so the measurement script is included in production

### LinkedIn publishing
- Draft generation works without LinkedIn credentials
- Direct publishing should only be enabled after the relevant LinkedIn API access is approved
- Keep `LINKEDIN_PUBLISH_ENABLED=false` until approval exists
- Protect the publish route with `LINKEDIN_PUBLISH_SECRET`

## GoDaddy: MCP e hospedagem

- **GoDaddy MCP** (developer.godaddy.com/mcp): serve para descoberta de domínios. Não é pipeline de deploy do site.
- **GoDaddy como host**: alguns planos cPanel conseguem rodar Node.js, mas o fluxo para `Next.js` com rotas de API, automação e previews fica mais manual do que o necessário para este projeto.
- **GoDaddy Domains API**: a automação de DNS via API depende da elegibilidade da conta, então não vale assumir que ela será o caminho mais simples.

Solução recomendada: deploy na **Vercel** e apontar o domínio **michael.business** (registrado no GoDaddy) via DNS.

## Deploy via CLI

```bash
# 1. Faça login (abre o navegador)
pnpm exec vercel login

# 2. Deploy em produção
pnpm deploy
```

Se o projeto ainda não existir na Vercel, o CLI perguntará se quer criar e vincular.

## Fluxo recomendado em 6 passos

1. Faça o primeiro deploy na Vercel usando o próprio repositório.
2. Configure as variáveis de ambiente da aplicação na Vercel.
3. Adicione `michael.business` no projeto da Vercel.
4. Copie os registros DNS que a Vercel pedir.
5. Crie esses registros no painel DNS da GoDaddy.
6. Depois disso, cada `push` para `main` publica automaticamente sem precisar mexer no domínio de novo.

## CLI útil para esse fluxo

```bash
# vincular o projeto local a um projeto Vercel
pnpm exec vercel link

# adicionar o domínio ao projeto
pnpm exec vercel domains add michael.business

# inspecionar os registros DNS esperados
pnpm exec vercel domains inspect michael.business
```

Se preferir zero manutenção de DNS no futuro, uma alternativa é manter o domínio registrado na GoDaddy e mover apenas o DNS para outra plataforma, como Vercel DNS ou Cloudflare DNS.

## GoDaddy Domain Rollout

### Option A: Root domain on Vercel
- Add `michael.business` in the Vercel project domains section
- Copy the DNS records requested by Vercel into GoDaddy
- Wait for propagation

### Option B: Safer two-step rollout
- First deploy on a temporary Vercel domain
- Validate the live site and links
- Then switch `michael.business` after validation

## Alternativas de plataforma

### Vercel
- Melhor encaixe para este repositório hoje
- O deploy automático principal agora é o Git integration da própria Vercel
- Melhor opção se você quer `GitHub -> deploy -> domínio` com o mínimo de atrito

### Netlify
- Boa alternativa se você quiser manter deploy automático por Git e usar CLI também
- Funciona bem para sites Next.js, mas neste projeto exigiria um ajuste maior do fluxo atual porque tudo já está orientado para Vercel

### Cloudflare
- Ótima opção se você quiser DNS, CDN e deploy no mesmo ecossistema
- Vale mais a pena se você topar adaptar a estratégia de deploy para o runtime da Cloudflare desde o começo

## Recommended Validation Checklist

- Home page loads in both English and Portuguese
- Google Analytics is receiving page views in GA4 Realtime
- Project pages render localized content correctly
- Article and news pages open correctly on refresh and direct access
- Resume download works
- Newsletter subscription returns success with configured Supabase credentials
- Contact links open LinkedIn, GitHub, and email correctly
- RSS feed is available at `/feed.xml`
- Sitemap is available at `/sitemap.xml`
- `michael.business` resolves without `404`

## Notes

- Keep the site Git-driven even when automation expands. Human review before publish remains the safest workflow.
- If you later add analytics, do it after the content and newsletter pipeline is stable.
