# Growth And Retention Plan

## Objective

Increase:

- repeat visits
- depth of session
- newsletter conversion
- movement from insight to proof to contact

## Current Implementation Status

### Phase 1 - Baseline And Funnel Instrumentation
- Implemented custom route-level `content_view` tracking
- Fixed scroll depth tracking so it resets across route changes
- Added click tracking for:
  - navigation
  - locale switch
  - content cards
  - related content
  - source/GitHub links
  - resume downloads
  - news filters and pagination
  - radar interactions

### Phase 2 - Discovery And Navigation
- Added `Tech Radar` to main navigation and footer discovery paths
- Promoted newsletter from a hidden destination to a visible top-level action
- Rebuilt the home hero to emphasize:
  - business proof
  - publication value
  - repeat-worthy assets
- Added a `Market Signals` section to the home page
- Added a dedicated `Tech Radar` promo section to the home page
- Root locale now respects:
  - saved locale preference
  - browser language fallback

### Phase 3 - Retention Surfaces
- Added contextual newsletter and next-step panels to:
  - article detail
  - project detail
  - news detail
- Added next-step CTAs on:
  - articles index
  - projects index
  - news index
  - radar page
- Added a guided entry-path section on the home page so visitors can choose the right starting layer by intent
- Added an above-the-fold continuity journey on article, project, and news detail pages to expose the best next move earlier
- Added a cross-format topic cluster on article, project, and news detail pages so visitors can keep the same theme while changing format

### Phase 4 - Dashboard And Analysis Layer
- Implemented internal event collection through `/api/analytics/collect`
- Added database-backed event storage in `public.analytics_events`
- Expanded the Streamlit dashboard with:
  - on-site engagement KPIs
  - an engagement funnel
  - top content paths
  - home entry-path CTR
  - retention surface CTR by journey vs end panel
  - newsletter source analysis
  - page type and locale mix

### Phase 5 - High-Value Content Rewrites
- Upgraded the priority projects with:
  - stronger proof points
  - explicit tradeoffs
  - clearer business stakes
- Upgraded the priority articles with:
  - stronger hooks
  - clearer takeaways
  - more memorable evidence
- Added a reusable editorial brief for future rewrites

### Phase 6 - Asset And Performance Optimization
- Replaced priority project and article covers with local brand visuals
- Normalized generated news snapshots and news persistence so stock editorial images are replaced before they spread through fallback content
- Cleaned root config so the active Next.js app is no longer mixed with unused Vite/Wouter toolchain entries
- Ignored Python cache artifacts to keep the repository signal cleaner during dashboard work
- Review legacy `client/` footprint for cleanup or removal
- Improved resume delivery beyond raw markdown with printable HTML resume routes
- Refreshed `baseline-browser-mapping` so build validation stays quieter and easier to trust

## Phase 7 - Cover Images, Social Media, And Scroll Journeys (2026-07)

- Article covers prefer generated JPG/PNG under `public/images/articles/` over SVG placeholders
- Article `og:image` uses the raster cover when present; otherwise the route `opengraph-image.tsx` branded card
- Backfill: `pnpm content:backfill:covers` / soft gate: `pnpm content:check:covers`
- LinkedIn publish prefers IMAGE upload of the cover when available, else ARTICLE URL with strong OG
- X publish attaches the cover via `twitter-api-v2` media upload on the root tweet when credentials exist
- On-site retention: reading progress bar, mid-article newsletter CTA, next-article prompt, clickable topic tags, lightweight articles filter (`?tag=` / search)
- Project cases end with an explicit contact CTA before the retention panel

## Next Iteration

- Monitor CTR improvements from meta title changes (baseline 2026-04-01: 116 impressions, position 6.8, CTR 0%)
- Add X/LinkedIn engagement metrics to the Streamlit dashboard (replies sent, impressions)
- Expand Tech Radar based on community usage data
- A/B test entry-path section variants on the home page
- Track social preview CTR after July cover backfill lands in production

## Definition Of Done For Growth Work

- Every major page has a clear next step
- Every major content surface emits analytics
- Every high-intent detail page exposes at least one cross-format related-content block before the final newsletter panel
- At least one repeat-worthy asset is discoverable from the main navigation
- Newsletter is reachable from:
  - header
  - home
  - detail pages
  - radar
- Documentation is updated at the end of each implementation batch
