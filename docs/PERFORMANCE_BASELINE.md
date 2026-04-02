# Performance Baseline

## What Was Cleaned Up

- High-value project and article covers now use local assets under `public/images/`
- Remaining project, article, and news surfaces that previously depended on Unsplash now resolve to local editorial assets
- News feed source defaults now point to local editorial covers for future synced items
- Generated news snapshots are now sanitized on write, so fallback content no longer preserves legacy Unsplash placeholders
- News imports and sync upserts now normalize stock editorial images before persisting rows
- Resume delivery now defaults to HTML-first reading with print-to-PDF support
- Root package metadata no longer carries unused Vite and Wouter dependencies for the archived client
- Root configuration now reflects the active Next.js app instead of the old Vite client
- Python cache artifacts are ignored in git
- `baseline-browser-mapping` was refreshed to remove the repeated Next.js build warning

## Why It Helps

- Fewer remote image dependencies on the most important surfaces improves ownership and reduces avoidable third-party image fetches
- Snapshot exports now stay aligned with the current editorial visual system instead of drifting back to old stock placeholders
- Resume traffic now lands on a more readable, higher-intent experience
- The root toolchain is easier to maintain because it describes the current runtime instead of both runtimes mixed together
- Repository noise from generated Python cache files no longer shows up in normal git status output
- Build output is cleaner, which makes real CI regressions easier to spot

## Remaining Follow-Ups

- Remove or archive the legacy `client/` directory entirely only when you are sure nothing historical needs to be preserved there
- Revisit whether the temporary Unsplash remote pattern in `next.config.mjs` is still needed once all external image producers are fully normalized
