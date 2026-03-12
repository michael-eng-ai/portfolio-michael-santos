# Michael Barbosa Santos Dynamic Platform

This repository powers a bilingual `Next.js` content platform designed to close the loop:

`GitHub -> site -> newsletter -> LinkedIn`

## What It Does

- turns GitHub repositories into business-facing project pages
- connects projects to real external references
- publishes bilingual articles and market commentary
- captures newsletter subscribers through a real backend path
- generates LinkedIn drafts from the same content model
- keeps deploy and content updates repeatable through Vercel and GitHub Actions

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- JSON-based Git content collections
- Supabase for newsletter subscribers
- Resend for welcome emails and lightweight newsletter delivery
- Google Analytics 4 for traffic and newsletter conversion tracking
- GitHub Actions for CI and content automation
- Vercel for production hosting and Git-based deploys

## Content Collections

- `content/projects/`: bilingual project case studies
- `content/articles/`: bilingual long-form articles
- `content/news/`: curated external references
- `content/linkedin/`: draft or published LinkedIn payloads
- `content/x/`: draft or published X payloads
- `content/generated/`: synchronized GitHub metadata snapshots

## Local Development

```bash
pnpm install
pnpm dev
```

## Validation And Build

```bash
pnpm content:validate
pnpm check
pnpm build
```

## Analytics

Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` with your GA4 measurement ID (for example `G-XXXXXXXXXX`) to enable:

- pageview tracking on all routes
- newsletter conversion events
- contact click conversion events
- production analytics on Vercel without changing the code again

## Authoring Workflow

```bash
pnpm content:new:project --slug your-project --repo owner/repo
pnpm content:new:article --slug your-article
pnpm content:generate:article
pnpm content:generate:article:claude -- --topic "AI agents for governed analytics"
pnpm content:local:automation -- --topic "AI agents for governed analytics"
pnpm content:sync:github
pnpm content:linkedin
pnpm content:x
```

## Newsletter

Newsletter subscribers are stored in Supabase using the schema in `supabase/newsletter_subscribers.sql`.

Optional welcome emails are sent through Resend when `RESEND_API_KEY` and `NEWSLETTER_FROM_EMAIL` are configured.

## LinkedIn Distribution

The repository supports two modes:

- draft-first workflow that always works
- API publish workflow when LinkedIn-approved credentials are available

## Deployment

See `DEPLOYMENT.md` for Vercel setup, required secrets, scheduled jobs, and domain rollout for `michael.business`.

For local scheduled generation with Claude Code, see `docs/LOCAL_CLAUDE_AUTOMATION.md`.

## Automation

- `.github/workflows/news-auto-publish.yml`: syncs curated RSS news every 6 hours and opens an automated PR with the generated refresh
- `.github/workflows/content-pipeline.yml`: syncs GitHub metadata and regenerates LinkedIn and X drafts, then opens a review PR
- `.github/workflows/article-draft-pipeline.yml`: generates a bilingual article draft with AI, refreshes social drafts, and opens a review PR
- `.github/workflows/social-distribution.yml`: publishes a selected draft slug to LinkedIn and/or X through protected API routes
- Vercel Git integration: deploys new commits automatically after they land on `main`
