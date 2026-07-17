import { LinkedinDraft } from "@/lib/content";
import { resolveLinkedinAuthorUrn } from "@/lib/linkedin-author";
import { Locale } from "@/lib/site";
import { withSocialUtm } from "@/lib/utm";

export type LinkedinShareMediaInput = {
  commentary: string;
  articleUrl?: string | null;
  title?: string | null;
  description?: string | null;
};

export function buildLinkedinUgcShareContent(input: LinkedinShareMediaInput) {
  const articleUrl = input.articleUrl?.trim();

  if (!articleUrl) {
    return {
      shareCommentary: { text: input.commentary },
      shareMediaCategory: "NONE" as const,
    };
  }

  const title = input.title?.trim();
  const description = input.description?.trim();

  return {
    shareCommentary: { text: input.commentary },
    shareMediaCategory: "ARTICLE" as const,
    media: [
      {
        status: "READY",
        originalUrl: articleUrl,
        ...(title ? { title: { text: title.slice(0, 200) } } : {}),
        ...(description ? { description: { text: description.slice(0, 300) } } : {}),
      },
    ],
  };
}

export async function publishLinkedinDraft(draft: LinkedinDraft, locale: Locale = "en") {
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
  const enabled = process.env.LINKEDIN_PUBLISH_ENABLED === "true";
  const localizedDraft = draft.locales[locale];
  const siteUrl = draft.urls[locale]
    ? withSocialUtm(draft.urls[locale], {
        source: "linkedin",
        campaign: draft.sourceSlug,
        content: locale,
      })
    : null;
  const proofUrl = draft.urls.proof;

  if (!enabled) {
    return {
      mode: "draft-only",
      published: false,
      reason: "LinkedIn publishing is disabled. Draft generated successfully.",
    } as const;
  }

  if (!accessToken) {
    throw new Error("LinkedIn environment variables are missing.");
  }

  const author = resolveLinkedinAuthorUrn(process.env);

  const commentary = [
    localizedDraft.hook,
    localizedDraft.body,
    localizedDraft.cta,
    siteUrl,
    proofUrl,
  ]
    .filter(Boolean)
    .join("\n\n");

  const payload = {
    author: author.authorUrn,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": buildLinkedinUgcShareContent({
        commentary,
        articleUrl: siteUrl,
        title: localizedDraft.hook,
        description: localizedDraft.body,
      }),
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
