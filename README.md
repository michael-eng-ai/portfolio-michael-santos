# Michael Santos -- Data Engineering & AI Strategy Platform

Bilingual (EN/PT) content platform that closes the loop:

```
GitHub -> Site -> Newsletter -> LinkedIn/X
         ^                        |
         |    AI Enrichment        |
         +---- PostgreSQL --------+
```

**Live**: [michael.business](https://michael.business)

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4, Radix UI |
| Database | PostgreSQL (`DATABASE_URL`) |
| Hosting | Vercel |
| Email | Resend |
| Analytics | Google Analytics 4, Vercel Analytics, Vercel Speed Insights, Streamlit Dashboard |
| AI | Claude API (Haiku -- news enrichment, trend briefings, engagement replies), OpenAI (article drafts) |
| Social | X API v2 (Pay Per Use, auto-reply bot), LinkedIn API v2 (auto-reply bot) |
| Infrastructure | OCI VM (ARM, 24GB RAM), nginx, Let's Encrypt, systemd timers |
| SEO | Sitemap, RSS feed, IndexNow, JSON-LD structured data |
| CI/CD | GitHub Actions, Vercel Git integration |

---

## Current Runtime Boundary

The production app is the Next.js App Router code under `app/`, `components/`, `lib/`, and `scripts/`.

The `client/` directory is kept only as a legacy archive from an earlier Vite app and is not part of the current build, typecheck, or deploy path.

---

## Architecture

```
content/                    # Git-based content (source of truth)
  projects/*.json           # Business case studies (bilingual)
  articles/*.json           # Long-form articles (bilingual)
  news/*.json               # Reference copies from PostgreSQL
  linkedin/*.json           # LinkedIn draft payloads
  x/*.json                  # X (Twitter) draft payloads
  sources/
    news-feeds.json         # RSS feed sources configuration
    trend-keywords.json     # Google News keywords for daily briefing
  generated/
    github-repos.json       # Live GitHub repository metadata
    news.json               # Last-known-good news fallback snapshot

app/
  [locale]/                 # Localized routes (en, pt)
    page.tsx                # Homepage
    projects/               # Project listing + detail pages
    articles/               # Article listing + detail pages
    news/                   # News listing + detail pages
    newsletter/             # Newsletter subscription
    resume/                 # Resume hub + printable HTML resume views
    contact/                # Contact page
  api/
    health/news/            # PostgreSQL news health check (503 on fallback)
    newsletter/subscribe/   # Newsletter subscription endpoint
    linkedin/publish/       # Protected LinkedIn publishing
    x/publish/              # Protected X publishing
  sitemap.ts                # Dynamic sitemap with i18n alternates
  robots.ts                 # robots.txt
  feed.xml/                 # RSS feed (articles)

scripts/                    # Automation scripts (tsx)
  sync-news.ts              # RSS feeds -> PostgreSQL
  export-news-snapshot.ts   # PostgreSQL -> content/generated/news.json
  enrich-news.ts            # Claude editorial analysis -> PostgreSQL
  post-news-to-x.ts         # News -> X API
  post-to-linkedin.ts       # News -> LinkedIn API
  reply-to-x-mentions.ts    # Auto-reply X mentions with Claude
  reply-to-linkedin-comments.ts  # Auto-reply LinkedIn comments with Claude
  generate-daily-trend-briefing.ts  # Google News + Claude -> article JSON + PostgreSQL
  sync-github-projects.ts   # GitHub API -> generated/github-repos.json
  generateDailyArticle.ts   # OpenAI -> article JSON
  generate-linkedin-drafts.ts
  generate-x-drafts.ts
  run-worker-task.ts        # Orchestrates multi-step worker cycles
  validate-content.ts       # Zod schema validation

content/
  radar.ts                  # Tech Radar data (24 technologies, 4 quadrants)

dashboard/                  # Streamlit analytics dashboard (Python)
  app.py                    # Main dashboard app (password-protected)
  fetch_search_console.py   # GSC data collection script
  generate_password_hash.py # Helper to generate dashboard password hash
  requirements.txt          # Python dependencies

client/                     # Legacy Vite app kept only for historical reference
lib/
  content.ts                # Zod schemas + content loaders
  news-delivery.ts          # Retry/DLQ field helpers for X + LinkedIn
  news-utils.ts             # Stable slugs, tag detection, snapshots
  postgres.ts               # PostgreSQL connection pool (the only DB client)
  seo.ts                    # SEO metadata builders
  tags.ts                   # Tag-to-hashtag mapping
  site.ts                   # i18n config

ops/oci/                    # OCI VM infrastructure
  deploy-to-vm.sh           # One-command deploy to OCI VM
  setup-dashboard.sh        # First-time dashboard infra setup
  nginx/dashboard.conf      # nginx reverse proxy config
  systemd/                  # All systemd service/timer units
```

---

## Automated Pipelines

### News Pipeline (hourly)

**Workflow**: `.github/workflows/news-sync.yml`
**Schedule**: Every hour (`0 * * * *`)

```
RSS Feeds (18 sources)
    |
    v
sync-news.ts -----> PostgreSQL (upsert by source_url)
    |                    |
    |                    v
    |              IndexNow notification
    |
    v
enrich-news.ts ---> Claude Haiku generates editorial analysis
    |                (150-200 words, EN + PT, max 5/run)
    |
    v
post-news-to-x.ts -> X API (max 3 tweets/run, uses editorial as body)
```

**RSS Sources**: AWS Blog, Confluent, Snowflake, Google Cloud, Databricks, dbt, Anthropic, Hugging Face, InfoQ, The New Stack, Martin Fowler, Changelog, GitHub Blog, TechCrunch AI

**Cost**: Claude Haiku ~$0.001/article, X API ~$0.01/tweet

### Daily Trend Briefing (daily)

**Workflow**: `.github/workflows/daily-trend-briefing.yml`
**Schedule**: Daily 10:23 UTC

```
Google News API (trend-keywords.json)
    |
    v
Filter headlines (last 48h)
    |
    v
Claude Haiku synthesizes 2-3 key themes
    (300-400 words, bilingual, data/business lens)
    |
    v
content/articles/daily-trend-briefing-YYYY-MM-DD.json
    |
    v
PostgreSQL news table (distribution cache)
```

### Content Pipeline (weekdays)

**Workflow**: `.github/workflows/content-pipeline.yml`
**Schedule**: Weekdays 11:00 UTC

```
GitHub API sync -> content/generated/github-repos.json
LinkedIn drafts -> content/linkedin/*.json
X drafts       -> content/x/*.json
Validate       -> Zod schema check
    |
    v
Opens PR for review (branch: chore/content-pipeline-updates)
```

### Article Draft Pipeline (weekdays)

**Workflow**: `.github/workflows/article-draft-pipeline.yml`
**Schedule**: Weekdays 11:30 UTC

```
OpenAI -> bilingual article JSON
       -> regenerate LinkedIn/X drafts
       -> opens PR (branch: chore/auto-article-drafts)
```

### Social Distribution (manual)

**Workflow**: `.github/workflows/social-distribution.yml`
**Trigger**: Manual with inputs (slug, locale, channel)

```
Draft JSON -> /api/linkedin/publish or /api/x/publish
           -> validates secret header
           -> publishes via respective API
```

### Engagement Bots (every 30 min)

**Timer**: `michael-engagement-cycle` on OCI VM

```
X Mentions API -> filter (skip own, skip RTs)
    |
    v
Claude Haiku generates contextual reply (<280 chars)
    |
    v
X API v2 reply (max 5/run, 30-90s delay between)

LinkedIn Social Actions API -> fetch comments on recent posts (7d)
    |
    v
Claude Haiku generates professional reply (<500 chars)
    |
    v
LinkedIn API reply (max 3/run, 15-45s delay between)
```

### Auto PR Review (on PR open)

**Workflow**: `.github/workflows/auto-pr-review.yml`
**Trigger**: `pull_request_target` (for secrets access)

```
gh pr diff -> Claude Haiku reviews (correctness, security, performance)
          -> posts comment on PR
```

Notes:
- The workflow injects the diff through `env` and builds the Anthropic payload with `jq`, which prevents shell-quoting failures on multi-line patches.
- Bot-authored PRs are skipped so automation branches do not create noisy review failures.
- Build health still comes from `CI` plus the Vercel preview check; the review workflow is advisory.
### Health Check (every 5 min)

**Timer**: `michael-health-check` on OCI VM

```
curl https://michael.business/api/health -> log OK/WARN
(monitors the site and keeps the PostgreSQL connection warm)
```

### CI Pipeline (on push/PR)

**Workflow**: `.github/workflows/ci.yml`

```
Install -> Content validation -> Type check -> Next.js build
```

---

## Tech Radar

Interactive technology assessment at `/radar` with 24 technologies across 4 quadrants:

| Quadrant | Examples |
|----------|---------|
| Data Processing | Spark, dbt, Polars, DuckDB, Flink |
| Storage & Query | Databricks, Snowflake, Iceberg, PostgreSQL, Supabase |
| Orchestration & Ops | Airflow, Terraform, GitHub Actions, Docker, Kafka |
| AI & ML | Claude API, RAG, MLflow, LangChain, Agentic AI |

Each technology has an adoption ring (Adopt, Trial, Assess, Hold) and movement indicator. Data lives in `content/radar.ts`.

---

## Analytics Dashboard

Private Streamlit dashboard at `https://analytics.michael.business`.

**Authentication** (two layers):
1. nginx basic auth (HTTPS + htpasswd)
2. Streamlit password gate (SHA-256 hash via `DASHBOARD_PASSWORD_HASH` env var)

**Metrics displayed**:
- Content pipeline funnel and publishing timeline
- Social delivery status (X + LinkedIn) with dead letter tracking
- GitHub repository stats (stars, forks, commits)
- Google Search Console (clicks, impressions, CTR, position, top queries/pages)
- News source breakdown

**Run locally**:
```bash
cd dashboard
pip install -r requirements.txt
DATABASE_URL="postgresql://..." DASHBOARD_PASSWORD_HASH="..." streamlit run app.py
```

**Fetch Search Console data**:
```bash
GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json python dashboard/fetch_search_console.py
```

See `DEPLOYMENT.md` for full setup instructions and credential locations.

---

## Deployment

### Primary: Vercel Git Integration (automatic)

```
Push to main -> Vercel detects -> Build -> Deploy to michael.business
```

### Manual Fallback

```bash
pnpm deploy          # vercel --prod
pnpm deploy:preview  # vercel (preview URL)
```

Or via workflow: `.github/workflows/deploy-vercel.yml`

### Domain

- **Domain**: michael.business (GoDaddy)
- **DNS**: Points to Vercel nameservers
- **SSL**: Automatic via Vercel

---

## Environment Variables

### Production (Vercel + GitHub Secrets)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SITE_URL` | Site URL (https://michael.business) |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 4 ID |
| `GOOGLE_SITE_VERIFICATION` | Google Search Console token |
| `DATABASE_URL` | PostgreSQL connection string (the only database config) |
| `DATABASE_SSL` | Optional SSL mode for PostgreSQL (`require`) |
| `RESEND_API_KEY` | Resend email delivery |
| `NEWSLETTER_FROM_EMAIL` | Sender email for newsletters |
| `ANTHROPIC_API_KEY` | Claude API for enrichment/briefings |
| `OPENAI_API_KEY` | OpenAI for article generation |
| `X_API_KEY` | X API consumer key |
| `X_API_SECRET` | X API consumer secret |
| `X_ACCESS_TOKEN` | X API access token |
| `X_ACCESS_TOKEN_SECRET` | X API access token secret |
| `LINKEDIN_ACCESS_TOKEN` | LinkedIn API token |
| `LINKEDIN_PERSON_URN` | LinkedIn person URN (optional if posting as person) |
| `LINKEDIN_ORGANIZATION_URN` | LinkedIn organization URN (preferred for Company Page posting) |
| `LINKEDIN_PUBLISH_SECRET` | Secret for /api/linkedin/publish |
| `X_USER_ACCESS_TOKEN` | Legacy route token (deprecated) |
| `X_PUBLISH_SECRET` | Secret for /api/x/publish |
| `INDEXNOW_KEY` | IndexNow search notification key |
| `VERCEL_TOKEN` | Vercel CLI token (manual deploys) |
| `VERCEL_ORG_ID` | Vercel org ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |

### Local Development

```bash
cp .env.example .env.local
# Fill in DATABASE_URL (and DATABASE_SSL=require if your server enforces TLS) minimum
pnpm install
pnpm dev
```

---

## Content Authoring

### Create new content

```bash
pnpm content:new:project --slug my-project --repo owner/repo
pnpm content:new:article --slug my-article
```

### Generate with AI

```bash
pnpm content:generate:article                    # OpenAI article
pnpm content:generate:article:claude -- --topic "topic"  # Claude article
pnpm content:local:automation -- --topic "topic"  # Full local pipeline
```

### Sync and distribute

```bash
pnpm content:sync:news        # RSS -> PostgreSQL
pnpm content:export:news-snapshot  # PostgreSQL -> content/generated/news.json
pnpm content:enrich:news      # Claude analysis -> PostgreSQL
pnpm db:cutover:check         # Verify PostgreSQL is reachable and has active news
pnpm content:post:x           # News -> X
pnpm content:daily:briefing   # Google News + Claude -> PostgreSQL
pnpm content:sync:github      # GitHub API -> generated/
pnpm content:linkedin          # Generate LinkedIn drafts
pnpm content:x                # Generate X drafts
pnpm content:pipeline          # Full pipeline (sync + drafts + validate)
```

### Validate

```bash
pnpm content:validate   # Zod schema check all collections
pnpm check              # TypeScript type check
pnpm build              # Full build (validate + Next.js)
```

---

## SEO Strategy

| Feature | Implementation |
|---------|---------------|
| Sitemap | Dynamic, includes all projects/articles + enriched news, i18n alternates |
| robots.txt | Allow all, points to sitemap |
| RSS Feed | /feed.xml (articles only, English) |
| JSON-LD | Person, Website, Article, Breadcrumb schemas |
| Meta redirects | 3 duplicate articles consolidated with 301 redirects |
| News indexing | Conditional: only pages with editorial analysis are indexed |
| Revalidation | Homepage 600s, news 3600s, sitemap 3600s |
| IndexNow | Notifies search engines of new news URLs |
| Analytics | GA4 events (newsletter_signup, contact_click), Vercel Analytics |

---

## PostgreSQL Tables

### news

| Column | Type | Notes |
|--------|------|-------|
| slug | text | Primary key |
| source_name | text | Feed source name |
| source_url | text | Original article URL (unique) |
| image_url | text | Nullable |
| tags | text[] | Auto-detected from content |
| locales | jsonb | {en: {title, summary, whyItMatters}, pt: {...}} |
| editorial_analysis | jsonb | {en: string, pt: string} -- Claude generated |
| category | jsonb | {en: string, pt: string} |
| related_project_slugs | text[] | Links to project content |
| published_at | timestamptz | Full publication timestamp |
| posted_to_x_at | timestamptz | Null until posted |
| is_active | boolean | Default true |

### newsletter_subscribers

| Column | Type | Notes |
|--------|------|-------|
| email | text | Unique |
| locale | text | en or pt |
| source | text | Origin page |
| consented_at | timestamptz | LGPD compliance |

---

## Cost Summary

| Service | Monthly Cost |
|---------|-------------|
| Vercel (Hobby) | Free |
| PostgreSQL (on OCI VM) | Free |
| Vercel Analytics | Free (50k events/month) |
| Google Analytics | Free |
| Claude API (Haiku) | ~$0.15 |
| X API (Pay Per Use) | ~$1-2 |
| Resend | Free (100 emails/day) |
| GoDaddy domain | ~$2/month |
| OCI VM (Always Free) | Free |
| **Total** | **~$5/month** |
Apply [news_reliability.sql](supabase/news_reliability.sql) on existing environments to add:

- full `published_at` timestamps
- per-channel retry/DLQ fields for X and LinkedIn
- external post IDs
- delivery indexes

The site now exposes [app/api/health/news/route.ts](app/api/health/news/route.ts), which returns `503` when PostgreSQL is unavailable and the app is serving the fallback snapshot instead.

PostgreSQL (via `DATABASE_URL`) is the only database. Set `DATABASE_URL` (and `DATABASE_SSL=require` if the server enforces TLS), run `pnpm db:cutover:check` to confirm the database is reachable and serving active news, then deploy. Database setup details live in [ops/gcp/worker/postgres/README.md](ops/gcp/worker/postgres/README.md) and [docs/GCP_WORKER_RUNBOOK.md](docs/GCP_WORKER_RUNBOOK.md).
