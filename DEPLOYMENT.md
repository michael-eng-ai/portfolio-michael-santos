# Deployment Guide

## Recommended Path

Use `Vercel` for production hosting and connect `michael.business` from GoDaddy after the first successful deploy.

This repository now runs as a `Next.js` content platform, which makes Vercel a strong default for routing, SEO outputs, previews, and custom domain handoff.

## What Is Already Configured

- `.github/workflows/ci.yml` for install, content validation, type check, and build
- `.github/workflows/news-auto-publish.yml` for automatic RSS news publication to `main`
- `.github/workflows/content-pipeline.yml` for scheduled GitHub sync and LinkedIn/X draft generation via pull request
- `.github/workflows/article-draft-pipeline.yml` for AI article draft generation plus social draft refresh
- `.github/workflows/social-distribution.yml` for protected distribution to LinkedIn and X
- `.github/workflows/deploy-vercel.yml` for optional manual deploys through GitHub Actions
- `app/sitemap.ts`, `app/robots.ts`, and `app/feed.xml/route.ts` for SEO outputs

## Required GitHub Secrets

Set these repository secrets only if you want to keep the manual GitHub Actions deploy workflow available:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Optional but recommended:

- `DATABASE_PROVIDER`
- `SECONDARY_DATABASE_PROVIDER`
- `DATABASE_URL`
- `DATABASE_SSL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `NEWSLETTER_FROM_EMAIL`
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- `GOOGLE_SITE_VERIFICATION`
- `OPENAI_API_KEY`
- `LINKEDIN_ACCESS_TOKEN`
- `LINKEDIN_PERSON_URN`
- `LINKEDIN_ORGANIZATION_URN`
- `LINKEDIN_PUBLISH_SECRET`
- `X_API_KEY`
- `X_API_SECRET`
- `X_ACCESS_TOKEN`
- `X_ACCESS_TOKEN_SECRET`
- `X_PUBLISH_SECRET`

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

### News reliability package
- Apply [news_reliability.sql](/Users/michaelsantos/Documents/GitHub/portfolio-michael-santos/supabase/news_reliability.sql) on the existing Supabase project
- Export a fresh fallback snapshot with `pnpm content:export:news-snapshot`
- Monitor `https://michael.business/api/health/news` from UptimeRobot or another uptime service

### VM shadow PostgreSQL
- Keep production on Supabase while the VM PostgreSQL is validated
- Add `DATABASE_URL` plus the `POSTGRES_*` variables to `.env.worker.local`
- Deploy with `ENABLE_POSTGRES=1 ./ops/gcp/worker/deploy-to-vm.sh`
- Run `pnpm db:shadow:sync` on the VM to copy `news` and `newsletter_subscribers`
- The VM bootstrap now applies `news.sql`, `newsletter_subscribers.sql`, and `analytics_events.sql` automatically on first start
- Run `pnpm db:shadow:verify` before any future cutover
- For worker-first cutover, set `DATABASE_PROVIDER=postgres` and `SECONDARY_DATABASE_PROVIDER=supabase` in `.env.worker.local`
- This keeps the worker writing to PostgreSQL while mirroring writes back to Supabase for the still-live Vercel site
- During the current transition, let the VM own hourly RSS sync and keep `.github/workflows/news-sync.yml` only for enrichment + X posting until social/API secrets are moved to the VM
- Once the VM receives the matching secrets, set the GitHub repository variables `VM_OWNS_NEWS_ENRICHMENT`, `VM_OWNS_X_POSTING`, `VM_OWNS_DAILY_BRIEFING`, and `VM_OWNS_LINKEDIN_POSTING` to `true`
- Do not point Vercel to the VM PostgreSQL until the database is reachable from Vercel with a safe network path
- The shadow database guide lives in [ops/gcp/worker/postgres/README.md](/Users/michaelsantos/Documents/GitHub/portfolio-michael-santos/ops/gcp/worker/postgres/README.md)

### GitHub sync and LinkedIn drafts
- The scheduled workflow runs `pnpm content:sync:github`
- It then runs `pnpm content:linkedin`
- It also runs `pnpm content:x`
- If outputs change, the workflow opens a pull request automatically

### AI article draft generation
- `.github/workflows/article-draft-pipeline.yml` runs on weekdays and manual dispatch
- It requires `OPENAI_API_KEY`
- It creates a bilingual article draft in `content/articles`
- It refreshes LinkedIn and X draft assets so distribution stays aligned with the site
- It opens a pull request instead of publishing directly, which keeps editorial review available

### Local Claude generation
- If you prefer running generation on your own machine, use `pnpm content:generate:article:claude`
- For branch plus commit plus optional PR automation, use `pnpm content:local:automation`
- The local automation guide lives in `docs/LOCAL_CLAUDE_AUTOMATION.md`
- Use `.env.content-automation.example` to keep the schedule settings out of the plist
- Use `scripts/run-local-content-automation.sh` together with `ops/macos/com.michael.content-automation.plist` for a stable macOS `launchd` setup

### Newsletter backend
- Create the subscriber table using `supabase/newsletter_subscribers.sql`
- Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Add Resend credentials if you want welcome emails enabled

### Google Analytics 4
- Create a GA4 Web Data Stream for `michael.business`
- Copy the Measurement ID, which looks like `G-XXXXXXXXXX`
- Add it to Vercel as `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- Redeploy or push a new commit so the measurement script is included in production

The site now emits these conversion-friendly events:

- `newsletter_signup`
- `contact_click`

In GA4, mark those events as key events if you want them treated as conversions in reports.

### Google Search Console
- Prefer a `Domain property` if you want one verification to cover `michael.business`, `www`, and future subdomains
- Use the TXT record that Search Console provides and add it in GoDaddy DNS
- Alternative: use a URL-prefix property and add the token to Vercel as `GOOGLE_SITE_VERIFICATION`
- After verification, submit `https://michael.business/sitemap.xml`

### LinkedIn publishing
- Draft generation works without LinkedIn credentials
- Direct publishing should only be enabled after the relevant LinkedIn API access is approved
- Keep `LINKEDIN_PUBLISH_ENABLED=false` until approval exists
- Protect the publish route with `LINKEDIN_PUBLISH_SECRET`
- Prefer `LINKEDIN_ORGANIZATION_URN` for Company Page posting; keep `LINKEDIN_PERSON_URN` only if the channel should publish as a person

### X publishing
- Draft generation works without X credentials
- Direct publishing now uses the same OAuth 1.0a credential set in both the worker scripts and the protected route
- Keep `X_PUBLISH_ENABLED=false` until the token is configured
- Protect the publish route with `X_PUBLISH_SECRET`
- Use `.github/workflows/social-distribution.yml` to publish a selected draft slug to LinkedIn, X, or both

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
- `newsletter_signup` and `contact_click` show up in GA4 after testing
- `michael.business/sitemap.xml` is submitted in Search Console
- Project pages render localized content correctly
- Article and news pages open correctly on refresh and direct access
- Resume download works
- Newsletter subscription returns success with configured Supabase credentials
- Contact links open LinkedIn, GitHub, and email correctly
- RSS feed is available at `/feed.xml`
- Sitemap is available at `/sitemap.xml`
- `michael.business` resolves without `404`

## OCI VM Worker

The OCI VM (`137.131.210.212`) runs all background automation. Deploy with:

```bash
ENABLE_TIMERS=1 ./ops/oci/deploy-to-vm.sh
```

### Systemd Timers

| Timer | Interval | Service |
|-------|----------|---------|
| `michael-news-cycle` | Hourly | RSS sync, enrich, curate, cleanup, post to X |
| `michael-daily-briefing` | Daily 10:39 UTC | Trend briefing + LinkedIn post |
| `michael-engagement-cycle` | Every 30 min | Reply to X mentions + LinkedIn comments |
| `michael-health-check` | Every 5 min | Ping `/api/health` (keeps Supabase active) |
| `michael-dashboard` | Persistent | Streamlit analytics dashboard |

### Auto PR Review

`.github/workflows/auto-pr-review.yml` uses `pull_request_target` to access secrets. Claude Haiku reviews every PR diff and posts a comment. Safe because it only reads the diff via `gh pr diff`, never executes PR code.

Implementation notes:
- The workflow now passes the diff into the shell through `env`, which avoids quoting failures when the patch contains single quotes, backticks, or YAML snippets.
- The Anthropic request body is assembled with `jq --arg`, not string interpolation, so JSON stays valid for large or multi-line diffs.
- Bot-authored PRs are skipped with `github.event.pull_request.user.type != 'Bot'` to avoid noisy failures on automation branches.
- GitHub `CI` and the Vercel preview deployment remain the actual build gates. `Auto PR Review` is advisory and should be debugged separately if it fails.
### Engagement Bots

**X Reply Bot** (`scripts/reply-to-x-mentions.ts`):
- Fetches mentions via X API v2
- Generates replies with Claude Haiku (max 5/run)
- Random delay between replies (30-90s)
- State tracked in `/opt/michael-business/run/last-mention-id.txt`

**LinkedIn Reply Bot** (`scripts/reply-to-linkedin-comments.ts`):
- Queries Postgres for posts with `linkedin_external_post_id` from last 7 days
- Fetches comments via LinkedIn Social Actions API
- Generates replies with Claude Haiku (max 3/run)
- State tracked in `/opt/michael-business/run/linkedin-replied-comments.json`

### Tech Radar

Interactive technology assessment page at `/radar`. 24 technologies across 4 quadrants (Data Processing, Storage & Query, Orchestration & Ops, AI & ML) with adoption rings (Adopt, Trial, Assess, Hold). Data lives in `content/radar.ts`.

---

## Analytics Dashboard

### Access

- **URL**: `https://analytics.michael.business`
- **Authentication**: Two layers
  1. nginx basic auth (user: `michael`)
  2. Streamlit password gate (SHA-256 hash)
- **Password**: stored in `.env.worker.local` as `DASHBOARD_PASSWORD_HASH`
- Generate a new password hash: `python dashboard/generate_password_hash.py`

### What It Shows

- Content pipeline funnel (synced -> active -> enriched -> posted)
- Social delivery status (X + LinkedIn with pie charts and dead letter counts)
- Publishing timeline (last 30 days)
- GitHub repository stats
- Google Search Console metrics (clicks, impressions, CTR, position, top queries)
- News source breakdown

### Architecture

```
Browser -> HTTPS (Let's Encrypt) -> nginx basic auth -> Streamlit (password) -> Postgres (read-only)
```

### First-Time Setup on VM

```bash
# Install dependencies (nginx, certbot, pip, streamlit)
sudo bash /opt/michael-business/portfolio-michael-santos/ops/oci/setup-dashboard.sh

# Or manually:
sudo pip3 install streamlit psycopg2-binary pandas plotly python-dotenv requests
sudo systemctl enable --now michael-dashboard.service
```

### SSL Certificate

- Issued by Let's Encrypt via certbot
- Auto-renewal: cron job at 3am daily (`/etc/cron.d/certbot-renew`)
- Manual renewal: `sudo /usr/local/bin/certbot renew`

### Google Search Console Integration

The dashboard can display GSC metrics automatically if data has been fetched.

**Service account**: `michael-gsc-reader@astute-veld-370221.iam.gserviceaccount.com`

```bash
# Fetch GSC data (run from VM or locally with credentials)
cd dashboard && python fetch_search_console.py
```

Required env vars:
- `GOOGLE_APPLICATION_CREDENTIALS` -- path to the service account JSON key
- `GSC_SITE_URL` -- Search Console property (default: `https://michael.business/`)

The service account key lives at `/etc/michael-business/gsc-service-account-key.json` on the VM (permissions 600, owned by michaelworker).

---

## Secrets and Credentials

### Where Secrets Live

| Location | Purpose | Committed |
|----------|---------|-----------|
| `.env.worker.local` | VM worker secrets (all API keys, DB credentials, dashboard password) | Never (gitignored) |
| `/etc/michael-business/worker.env` | Deployed copy on OCI VM | N/A (VM only) |
| `/etc/michael-business/gsc-service-account-key.json` | GCP service account key for Search Console | N/A (VM only) |
| `/etc/nginx/conf.d/.htpasswd` | nginx basic auth credentials | N/A (VM only) |
| GitHub Secrets | CI/CD workflows (ANTHROPIC_API_KEY, X/LinkedIn tokens, etc.) | N/A |

### What Is Gitignored

The `.gitignore` blocks all sensitive patterns:
- `.env`, `.env.local`, `.env.worker.local` and variants
- `*.pem`, `*.key`, `*.p12`, `*.pfx`, `*.jks`
- `*-key.json`, `*credentials*.json`, `service-account*.json`
- `.htpasswd`, `secrets/`
- `dashboard/data/` (fetched API data)

### Adding New Secrets

1. Add to `.env.worker.local` locally
2. Add the key name to `allowed_keys` in `ops/oci/deploy-to-vm.sh`
3. Add to `.env.worker.local.example` (without the value)
4. Run `ENABLE_TIMERS=1 ./ops/oci/deploy-to-vm.sh` to deploy
5. If needed by GitHub Actions, also add to GitHub Secrets

---

## DNS

- **Registrar**: GoDaddy
- **Nameservers**: `ns49.domaincontrol.com`, `ns50.domaincontrol.com`
- **Records**:
  - `@` A `76.76.21.21` (Vercel)
  - `analytics` A `137.131.210.212` (OCI VM dashboard)
  - CNAME records for Vercel as needed

---

## Notes

- Keep the site Git-driven even when automation expands. Human review before publish remains the safest workflow.
- If you later add analytics, do it after the content and newsletter pipeline is stable.
