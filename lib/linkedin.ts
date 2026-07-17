import { LinkedinDraft } from "@/lib/content";
import { resolveLinkedinAuthorUrn } from "@/lib/linkedin-author";
import { Locale } from "@/lib/site";
import {
  resolveArticleCoverDiskPath,
  uploadLinkedinImageAsset,
} from "@/lib/social-media";
import { withSocialUtm } from "@/lib/utm";

export type LinkedinShareMediaInput = {
  commentary: string;
  articleUrl?: string | null;
  title?: string | null;
  description?: string | null;
  /** LinkedIn digitalmedia asset URN for IMAGE shares. */
  imageAssetUrn?: string | null;
};

/** Build a stable public LinkedIn URL from a ugcPosts / activity id or URN. */
export function buildLinkedinPublishedUrl(postId: string | null | undefined): string | null {
  if (!postId) {
    return null;
  }

  const trimmed = postId.trim();
  if (!trimmed || trimmed === "unknown") {
    return null;
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  // ugcPost / share / activity URNs all resolve via the feed update deep link.
  return `https://www.linkedin.com/feed/update/${encodeURIComponent(trimmed)}`;
}

export function buildLinkedinUgcShareContent(input: LinkedinShareMediaInput) {
  const imageAssetUrn = input.imageAssetUrn?.trim();
  if (imageAssetUrn) {
    return {
      shareCommentary: { text: input.commentary },
      shareMediaCategory: "IMAGE" as const,
      media: [
        {
          status: "READY",
          media: imageAssetUrn,
          ...(input.title ? { title: { text: input.title.slice(0, 200) } } : {}),
          ...(input.description
            ? { description: { text: input.description.slice(0, 300) } }
            : {}),
        },
      ],
    };
  }

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
  const preferImage = process.env.LINKEDIN_PREFER_IMAGE_SHARE !== "false";
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

  let imageAssetUrn: string | null = null;
  if (preferImage && draft.sourceType === "article") {
    const coverPath = resolveArticleCoverDiskPath(draft.sourceSlug, draft.mediaPath);
    if (coverPath) {
      try {
        imageAssetUrn = await uploadLinkedinImageAsset({
          accessToken,
          ownerUrn: author.authorUrn,
          filePath: coverPath,
        });
        console.log(`LinkedIn IMAGE asset uploaded for ${draft.sourceSlug}`);
      } catch (error) {
        console.warn(
          `LinkedIn IMAGE upload failed for ${draft.sourceSlug}; falling back to ARTICLE OG share: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
  }

  const payload = {
    author: author.authorUrn,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": buildLinkedinUgcShareContent({
        commentary,
        articleUrl: siteUrl,
        title: localizedDraft.hook,
        description: localizedDraft.body,
        imageAssetUrn,
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
  const id = headerId ?? data.id ?? null;

  return {
    mode: "api",
    published: true,
    id,
    publishedUrl: buildLinkedinPublishedUrl(id),
    publishedAt: new Date().toISOString(),
    locale,
    shareMediaCategory: imageAssetUrn ? "IMAGE" : "ARTICLE",
  } as const;
}
