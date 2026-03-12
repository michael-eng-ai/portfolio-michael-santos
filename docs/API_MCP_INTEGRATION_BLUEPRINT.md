# API And MCP Integration Blueprint

## Goal

Prepare the site, GitHub, LinkedIn, and X ecosystem to stay integrated without exposing the orchestration publicly.

This blueprint is not a public-facing artifact. It is an implementation guide for the integration layer.

## Integration Roles

### GitHub
- Source of operational truth
- Stores code, README, technical architecture, and implementation history
- Feeds repository metadata into the site

### Site
- Source of business-facing narrative
- Publishes articles, business cases, and curated references
- Captures newsletter subscribers

### LinkedIn
- Source of public distribution
- Repackages business and technical signals into short-form posts
- Should receive either:
  - draft content for approval
  - direct publish requests when approved API access exists

### X
- Source of repeat distribution and visibility loops
- Repackages the same signal into concise posts or short threads
- Should receive either:
  - draft content for approval
  - direct publish requests when approved API access and plan access exist

## Recommended Integration Modes

### Mode 1: Safe Default
- GitHub metadata sync through GitHub API
- Site content managed in Git
- LinkedIn and X drafts generated locally or through workflow
- Manual final publish to LinkedIn and X

### Mode 2: Approved API Expansion
- GitHub metadata sync remains the same
- Site content remains Git-driven
- LinkedIn and X publish APIs are enabled after access approval
- Publish status is written back into content metadata

## MCP Opportunities

If an MCP server or tool wrapper is available later, it should be used for:

- creating or updating GitHub repos and README files
- triggering content sync jobs
- creating LinkedIn and X drafts from approved templates
- optionally publishing LinkedIn and X posts when the required access exists

Do not depend on MCP as the only path. Keep CLI and API fallbacks available.

## API Surfaces Already Prepared

- Newsletter subscribe endpoint:
  - `app/api/newsletter/subscribe/route.ts`
- LinkedIn publish endpoint:
  - `app/api/linkedin/publish/route.ts`
- X publish endpoint:
  - `app/api/x/publish/route.ts`

## Data Flow

1. A new project is created with AI assistance.
2. AI fills:
   - site angle
   - github angle
   - linkedin angle
   - x angle
3. The site receives the business-facing project entry.
4. GitHub receives or updates the technical implementation.
5. LinkedIn receives a short bridge draft.
6. X receives a short post or compact thread.
7. Metadata sync refreshes the site with GitHub proof signals.

## Guardrails

- Never publish identical copy across all channels
- Never let GitHub metadata overwrite a higher-quality hand-written business narrative
- Never enable automatic LinkedIn publishing without explicit approved credentials
- Never enable automatic X publishing without explicit approved credentials and token scope
- Keep site copy executive-facing and GitHub copy operational
