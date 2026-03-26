# Michael Santos -- Data Engineering & AI Strategy Platform

Bilingual (EN/PT) content platform that closes the loop:

```
GitHub -> Site -> Newsletter -> LinkedIn/X
         ^                        |
         |    AI Enrichment        |
         +---- Supabase ----------+
```

**Live**: [michael.business](https://michael.business)

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4, Radix UI |
| Database | Supabase (PostgreSQL) |
| Hosting | Vercel |
| Email | Resend |
| Analytics | Google Analytics 4, Vercel Analytics, Vercel Speed Insights |
| AI | Claude API (Haiku -- news enrichment, trend briefings), OpenAI (article drafts) |
| Social | X API v2 (Pay Per Use), LinkedIn API v2 |
| SEO | Sitemap, RSS feed, IndexNow, JSON-LD structured data |
| CI/CD | GitHub Actions, Vercel Git integration |

---

## Architecture

```
content/                    # Git-based content (source of truth)
  projects/*.json           # Business case studies (bilingual)
  articles/*.json           # Long-form articles (bilingual)
  news/*.json               # Reference copies from Supabase
  linkedin/*.json           # LinkedIn draft payloads
  x/*.json                  # X (Twitter) draft payloads
  sources/
    news-feeds.json         # RSS feed sources configuration
    trend-keywords.json     # Google News keywords for daily briefing
  generated/
    github-repos.json       # Live GitHub repository metadata

app/
  [locale]/                 # Localized routes (en, pt)
    page.tsx                # Homepage
    projects/               # Project listing + detail pages
    articles/               # Article listing + detail pages
    news/                   # News listing + detail pages
    newsletter/             # Newsletter subscription
    resume/                 # Resume/CV
    contact/                # Contact page
  api/
    newsletter/subscribe/   # Newsletter subscription endpoint
    linkedin/publish/       # Protected LinkedIn publishing
    x/publish/              # Protected X publishing
  sitemap.ts                # Dynamic sitemap with i18n alternates
  robots.ts                 # robots.txt
  feed.xml/                 # RSS feed (articles)

scripts/                    # Automation scripts (tsx)
  sync-news.ts              # RSS feeds -> Supabase
  enrich-news.ts            # Claude editorial analysis -> Supabase
  post-news-to-x.ts         # News -> X API
  generate-daily-trend-briefing.ts  # Google News + Claude -> Supabase
  sync-github-projects.ts   # GitHub API -> generated/github-repos.json
  generateDailyArticle.ts   # OpenAI -> article JSON
  generate-linkedin-drafts.ts
  generate-x-drafts.ts
  validate-content.ts       # Zod schema validation

lib/
  content.ts                # Zod schemas + content loaders
  supabase.ts               # Supabase admin client
  seo.ts                    # SEO metadata builders
  tags.ts                   # Tag-to-hashtag mapping
  site.ts                   # i18n config
```

---

## Automated Pipelines

### News Pipeline (hourly)

**Workflow**: `.github/workflows/news-sync.yml`
**Schedule**: Every hour (`0 * * * *`)

```
RSS Feeds (8 sources)
    |
    v
sync-news.ts -----> Supabase (upsert by source_url)
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
Supabase news table (with editorial_analysis)
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

### CI Pipeline (on push/PR)

**Workflow**: `.github/workflows/ci.yml`

```
Install -> Content validation -> Type check -> Next.js build
```

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
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin key |
| `RESEND_API_KEY` | Resend email delivery |
| `NEWSLETTER_FROM_EMAIL` | Sender email for newsletters |
| `ANTHROPIC_API_KEY` | Claude API for enrichment/briefings |
| `OPENAI_API_KEY` | OpenAI for article generation |
| `X_API_KEY` | X API consumer key |
| `X_API_SECRET` | X API consumer secret |
| `X_ACCESS_TOKEN` | X API access token |
| `X_ACCESS_TOKEN_SECRET` | X API access token secret |
| `LINKEDIN_ACCESS_TOKEN` | LinkedIn API token |
| `LINKEDIN_PERSON_URN` | LinkedIn person URN |
| `LINKEDIN_PUBLISH_SECRET` | Secret for /api/linkedin/publish |
| `X_PUBLISH_SECRET` | Secret for /api/x/publish |
| `INDEXNOW_KEY` | IndexNow search notification key |
| `VERCEL_TOKEN` | Vercel CLI token (manual deploys) |
| `VERCEL_ORG_ID` | Vercel org ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |

### Local Development

```bash
cp .env.example .env.local
# Fill in SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY minimum
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
pnpm content:sync:news        # RSS -> Supabase
pnpm content:enrich:news      # Claude analysis -> Supabase
pnpm content:post:x           # News -> X
pnpm content:daily:briefing   # Google News + Claude -> Supabase
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

## Supabase Tables

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
| published_at | text | YYYY-MM-DD |
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
| Supabase (Free tier) | Free |
| Vercel Analytics | Free (50k events/month) |
| Google Analytics | Free |
| Claude API (Haiku) | ~$0.15 |
| X API (Pay Per Use) | ~$1-2 |
| Resend | Free (100 emails/day) |
| GoDaddy domain | ~$2/month |
| **Total** | **~$5/month** |
