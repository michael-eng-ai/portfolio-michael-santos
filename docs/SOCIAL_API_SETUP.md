# Social API Setup

## Goal

Configure the minimum credentials needed to test automated distribution to LinkedIn and X from the site workflows.

## LinkedIn

### What this project expects

- `LINKEDIN_PUBLISH_ENABLED=true`
- `LINKEDIN_ACCESS_TOKEN`
- `LINKEDIN_PERSON_URN`
- `LINKEDIN_PUBLISH_SECRET`

### Recommended app path

1. Create a LinkedIn app in the LinkedIn Developer portal.
2. Add the product that allows member posting through self-serve sharing.
3. Request an OAuth token with `w_member_social`.
4. Derive the member URN as:
   - `urn:li:person:<member_id>`

### Notes

- This project publishes member posts using the `ugcPosts` API.
- The access token and the member URN must belong to the same LinkedIn account.
- Keep `LINKEDIN_PUBLISH_ENABLED=false` until the token is ready.
- Article drafts store an optional `mediaPath` (raster cover). On publish, the app tries LinkedIn IMAGE upload first (`LINKEDIN_PREFER_IMAGE_SHARE` defaults to true), then falls back to ARTICLE share so LinkedIn scrapes `og:image` from michael.business.
- Strong social previews require a JPG/PNG cover in `public/images/articles/` — SVG placeholders are weak on LinkedIn.

## X

### What this project expects

- `X_PUBLISH_ENABLED=true`
- `X_USER_ACCESS_TOKEN`
- `X_PUBLISH_SECRET`

### Recommended app path

1. Create an app in the X developer portal.
2. Ensure the app has write access for posts.
3. Generate a user-context access token that can create posts on your behalf.
4. Keep the token only in Vercel environment variables.

### Notes

- The project publishes through the `POST /2/tweets` endpoint (`twitter-api-v2`).
- If multiple post segments exist in the draft, the project publishes them as a thread.
- When a draft has `mediaPath` (or a local article cover exists), the root tweet uploads that image via v1 media upload before posting.
- Keep `X_PUBLISH_ENABLED=false` until the token is ready. Do not auto-spam every draft — publish is still opt-in via workflow/API.

## GitHub Actions Secrets

For **article draft LinkedIn publishing** (preferred path — persists `publishedUrl` in git):

- `LINKEDIN_ACCESS_TOKEN`
- `LINKEDIN_PERSON_URN` and/or `LINKEDIN_ORGANIZATION_URN`

Optional / legacy production API dispatch:

- `LINKEDIN_PUBLISH_SECRET` (Vercel route `/api/linkedin/publish`)
- `X_PUBLISH_SECRET` (Vercel route `/api/x/publish`)

For **news → LinkedIn** in `daily-trend-briefing.yml`:

- Prefer `DATABASE_URL` (+ `DATABASE_SSL` when needed) for the Postgres delivery queue
- If `DATABASE_URL` is absent, the job uses file-based `content/news` + `content/generated/linkedin-news-delivery.json` instead of skipping

Ownership: set repository variable `VM_OWNS_LINKEDIN_POSTING=true` only when the GCP VM owns news posting. Automatic LinkedIn **article draft** publish on push is then skipped to avoid double posts; manual `workflow_dispatch` still works.

## Site ↔ LinkedIn sync

1. `article-draft-pipeline` generates the article + LinkedIn/X drafts and opens a PR.
2. On merge to `main`, `social-distribution` runs (path filter on `content/articles/**` + `content/linkedin/**`).
3. It publishes at most one unpublished July+ article draft via `pnpm content:publish:linkedin`, then commits `status` / `publishedUrl` / `publishedAt`.
4. The article page shows **Discuss on LinkedIn** when `publishedUrl` is present.

## Test Flow

1. Configure LinkedIn secrets in GitHub Actions (and Vercel if using the API route).
2. Regenerate drafts: `pnpm content:linkedin`
3. Dry-run: `pnpm content:publish:linkedin -- --since=2026-07-01 --max=1 --dry-run`
4. Publish one: `pnpm content:publish:linkedin -- --slug article-<slug> --locale en --delay-ms 0`
5. Or run Actions: `gh workflow run social-distribution.yml -f mode=recent-articles -f since=2026-07-01 -f max=1 -f channel=linkedin`
