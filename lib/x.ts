import { XDraft } from "@/lib/content";
import { Locale } from "@/lib/site";

type PublishTweetResponse = {
  data?: {
    id?: string;
  };
};

export async function publishXDraft(draft: XDraft, locale: Locale = "en") {
  const enabled = process.env.X_PUBLISH_ENABLED === "true";
  const accessToken = process.env.X_USER_ACCESS_TOKEN;
  const posts = draft.locales[locale].posts;

  if (!enabled) {
    return {
      mode: "draft-only",
      published: false,
      reason: "X publishing is disabled. Draft generated successfully.",
    } as const;
  }

  if (!accessToken) {
    throw new Error("X environment variables are missing.");
  }

  let replyToTweetId: string | null = null;
  let rootTweetId: string | null = null;
  const publishedIds: string[] = [];

  for (const [index, text] of posts.entries()) {
    const payload = replyToTweetId
      ? {
          text,
          reply: {
            in_reply_to_tweet_id: replyToTweetId,
          },
        }
      : { text };

    const response = await fetch("https://api.x.com/2/tweets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`X publish failed on post ${index + 1}: ${message}`);
    }

    const data = (await response.json()) as PublishTweetResponse;
    const tweetId = data.data?.id;

    if (!tweetId) {
      throw new Error(`X publish failed on post ${index + 1}: missing tweet id.`);
    }

    if (!rootTweetId) {
      rootTweetId = tweetId;
    }

    replyToTweetId = tweetId;
    publishedIds.push(tweetId);
  }

  return {
    mode: "api",
    published: true,
    locale,
    ids: publishedIds,
    id: rootTweetId,
    publishedUrl: rootTweetId ? `https://x.com/i/web/status/${rootTweetId}` : null,
  } as const;
}
