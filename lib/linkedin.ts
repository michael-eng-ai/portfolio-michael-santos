import { LinkedinDraft } from "@/lib/content";
import { Locale } from "@/lib/site";

export async function publishLinkedinDraft(draft: LinkedinDraft, locale: Locale = "en") {
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
  const personUrn = process.env.LINKEDIN_PERSON_URN;
  const enabled = process.env.LINKEDIN_PUBLISH_ENABLED === "true";
  const localizedDraft = draft.locales[locale];
  const siteUrl = draft.urls[locale];
  const proofUrl = draft.urls.proof;

  if (!enabled) {
    return {
      mode: "draft-only",
      published: false,
      reason: "LinkedIn publishing is disabled. Draft generated successfully.",
    } as const;
  }

  if (!accessToken || !personUrn) {
    throw new Error("LinkedIn environment variables are missing.");
  }

  const payload = {
    author: personUrn,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: {
          text: [
            localizedDraft.hook,
            localizedDraft.body,
            localizedDraft.cta,
            siteUrl,
            proofUrl,
          ]
            .filter(Boolean)
            .join("\n\n"),
        },
        shareMediaCategory: "NONE",
      },
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
    },
  };

  const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "X-Restli-Protocol-Version": "2.0.0",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`LinkedIn publish failed: ${message}`);
  }

  const data = (await response.json().catch(() => ({}))) as { id?: string };
  const headerId = response.headers.get("x-restli-id");

  return {
    mode: "api",
    published: true,
    id: headerId ?? data.id ?? null,
    locale,
  } as const;
}
