# Documentation Index

Central index for all project documentation. Each document has a single responsibility and is grouped by domain.

---

## 1. Getting Started

| Document | Description |
|----------|-------------|
| [README.md](../README.md) | Project overview, architecture, pipelines, stack, and quick-start commands |
| [DEPLOYMENT.md](../DEPLOYMENT.md) | Vercel setup, OCI VM worker, analytics dashboard, DNS, secrets reference |

---

## 2. Growth and Product Strategy

| Document | Description |
|----------|-------------|
| [GROWTH_RETENTION_PLAN.md](GROWTH_RETENTION_PLAN.md) | Six-phase plan for repeat visits, session depth, newsletter conversion, and contact intent |
| [NAVIGATION_AND_DISCOVERY.md](NAVIGATION_AND_DISCOVERY.md) | Principles for site entry, exploration flow, and revisit patterns |
| [HIGH_VALUE_CONTENT_BRIEFS.md](HIGH_VALUE_CONTENT_BRIEFS.md) | Editorial briefs for priority projects and articles (proof points, hooks, takeaways) |

---

## 3. Brand and Content

| Document | Description |
|----------|-------------|
| [BRAND_IDENTITY.md](BRAND_IDENTITY.md) | Brand positioning, tone, visual identity, and messaging framework |
| [EDITORIAL_DESIGN_RULES.md](EDITORIAL_DESIGN_RULES.md) | Visual standards for premium, scannable, business-facing design |
| [CONTENT_CHANNEL_SYSTEM.md](CONTENT_CHANNEL_SYSTEM.md) | How topics are expressed differently across site, GitHub, LinkedIn, and X |
| [SOCIAL_SIGNAL_PLAYBOOK.md](SOCIAL_SIGNAL_PLAYBOOK.md) | Curated LinkedIn/X “signal” posts: human hooks + real screenshots (vs AI article covers) |
| [AUTHORITY_PROFILE_PLAYBOOK.md](AUTHORITY_PROFILE_PLAYBOOK.md) | Guidelines for aligning public profiles across platforms for authority building |

---

## 4. Analytics and Measurement

| Document | Description |
|----------|-------------|
| [ANALYTICS_EVENT_SCHEMA.md](ANALYTICS_EVENT_SCHEMA.md) | Event tracking schema for acquisition, engagement, subscription, and content paths |
| [ANALYTICS_DASHBOARD_RUNBOOK.md](ANALYTICS_DASHBOARD_RUNBOOK.md) | Operational runbook for the Streamlit analytics dashboard (KPIs, funnels, GSC) |
| [PERFORMANCE_BASELINE.md](PERFORMANCE_BASELINE.md) | Cleanup and optimization work for assets, images, news sync, and HTML delivery |

---

## 5. Infrastructure and Operations

| Document | Description |
|----------|-------------|
| [CREDENTIAL_BACKUP_POLICY.md](CREDENTIAL_BACKUP_POLICY.md) | Rules for managing API keys, tokens, certificates, and local credential backups |
| [SOCIAL_API_SETUP.md](SOCIAL_API_SETUP.md) | Configuration guide for LinkedIn and X API credentials |
| [API_MCP_INTEGRATION_BLUEPRINT.md](API_MCP_INTEGRATION_BLUEPRINT.md) | Integration blueprint for site, GitHub, LinkedIn, and X ecosystem |
| [GCP_WORKER_RUNBOOK.md](GCP_WORKER_RUNBOOK.md) | Guide for the GCP/OCI VM worker (news pipeline, database migration) |
| [LOCAL_CLAUDE_AUTOMATION.md](LOCAL_CLAUDE_AUTOMATION.md) | Setup for local content generation with Claude Code and Git-driven workflow |
| [secrets/README.local.md](../secrets/README.local.md) | Instructions for the local-only credential backup directory structure |

---

## Quick Reference

### Where secrets live

| Location | What | Committed |
|----------|------|-----------|
| `.env.worker.local` | All VM API keys, DB credentials, dashboard password | Never |
| `/etc/michael-business/worker.env` | Deployed copy on OCI VM | N/A |
| `/etc/michael-business/gsc-service-account-key.json` | Google Search Console service account key | N/A |
| `/etc/nginx/conf.d/.htpasswd` | nginx basic auth for analytics dashboard | N/A |
| GitHub Secrets | CI/CD workflow secrets | N/A |
| `secrets/` directory | Local credential backups (gitignored) | Never |

### Key URLs

| Service | URL |
|---------|-----|
| Site | https://michael.business |
| Analytics Dashboard | https://analytics.michael.business |
| Tech Radar | https://michael.business/en/radar |
| Health Check | https://michael.business/api/health |
| GitHub | https://github.com/michael-eng-ai/portfolio-michael-santos |

### OCI VM Timers

| Timer | Interval | What it does |
|-------|----------|--------------|
| `michael-news-cycle` | Hourly | RSS sync, enrich, curate, cleanup, post to X |
| `michael-daily-briefing` | Daily 10:39 UTC | Trend briefing + LinkedIn post |
| `michael-engagement-cycle` | Every 30 min | Reply to X mentions + LinkedIn comments |
| `michael-health-check` | Every 5 min | Ping /api/health |
| `michael-worker-health-report` | Every 15 min | Record systemd and worker-run health |
| `michael-dashboard` | Persistent | Streamlit analytics dashboard |
