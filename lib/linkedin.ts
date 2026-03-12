import { LinkedinDraft } from "@/lib/content";

export async function publishLinkedinDraft(draft: LinkedinDraft) {
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
  const personUrn = process.env.LINKEDIN_PERSON_URN;
  const enabled = process.env.LINKEDIN_PUBLISH_ENABLED === "true";

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
    commentary: `${draft.locales.en.hook}\n\n${draft.locales.en.body}\n\n${draft.locales.en.cta}`,
    visibility: "PUBLIC",
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false,
  };

  const response = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Linkedin-Version": "202502",
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

  return {
    mode: "api",
    published: true,
    id: data.id ?? null,
  } as const;
}
