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

Add the publish secrets to GitHub Actions if you want workflow dispatch publishing:

- `LINKEDIN_PUBLISH_SECRET`
- `X_PUBLISH_SECRET`

Use the same values that are stored in Vercel, because the workflow calls the production API routes.

## Test Flow

1. Configure the Vercel environment variables.
2. Trigger a production deploy.
3. Pick a draft slug from:
   - `content/linkedin`
   - `content/x`
4. Run the `Social Distribution` workflow with:
   - `slug`
   - `locale`
   - `channel`
5. Confirm the result in the workflow logs and in the social platform account.
