# Analytics Dashboard Runbook

## Purpose

Provide one operational place to review:

- content views
- deep reading behavior
- recirculation
- newsletter conversion
- contact and resume intent

## Internal Analytics Pipeline

### Collection
- Client events are emitted from `lib/analytics.ts`
- Events are sent to `/api/analytics/collect`
- Valid events are stored in `public.analytics_events`

### Storage
- SQL schema: `supabase/analytics_events.sql`
- Writes go through the shared database abstraction in `lib/database.ts`
- If a secondary database provider is configured, events are written there too

### Visualization
- The Streamlit dashboard reads `public.analytics_events`
- Dashboard entry point: `dashboard/app.py`

## Required Setup

1. Apply `supabase/analytics_events.sql` to the active database.
2. If you use the Postgres shadow, rerun the shadow bootstrap sync so the table exists there too.
3. Open the site and generate a few events by browsing pages and submitting test interactions.
4. Open the dashboard and verify the new engagement sections populate.

## Dashboard Sections

### On-Site Engagement
- Last 30 days of:
  - content views
  - sessions
  - deep reads
  - related clicks
  - signups and high-intent actions

### Engagement Funnel
- Session-level movement through:
  - content view
  - deep read
  - related click
  - newsletter signup
  - high-intent action

### Top Content Paths
- Best-performing pages by:
  - views
  - sessions
  - deep-read rate
  - related-click rate

### Home Entry Paths
- Which homepage intent paths are getting clicks
- Which locale is using them
- Session CTR from entry-path impression to click

### Retention Surface Performance
- Session CTR for:
  - article journey
  - news journey
  - project journey
  - article topic cluster
  - news topic cluster
  - project topic cluster
  - end-of-page retention panels
- Target-type mix to see whether people move toward:
  - proof
  - strategic context
  - radar
  - newsletter

### Newsletter Sources And Locale Mix
- Which placements and locales are producing subscriptions

### Views By Page Type
- Which page families are driving the most consumption

## Weekly Review Questions

- Which page types are generating the strongest deep-read rate?
- Which specific pages get views but poor recirculation?
- Which entry path gets the best click-through from the home page?
- Are the early journey blocks and topic clusters outperforming the end-of-page retention panels?
- Which newsletter source converts best?
- Is PT or EN producing stronger conversion on similar surfaces?
- Are repeat-worthy assets like `radar` creating enough engaged sessions?

## Operational Notes

- Internal analytics complements GA and Search Console; it does not replace them.
- Internal analytics is better for product funnel questions than acquisition questions.
- Avoid sending PII in event payloads.
