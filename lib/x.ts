import { TwitterApi } from "twitter-api-v2";

import { XDraft } from "@/lib/content";
import { Locale } from "@/lib/site";
import { resolveSocialPublishMediaPath, uploadXMedia } from "@/lib/social-media";

export async function publishXDraft(draft: XDraft, locale: Locale = "en") {
  const enabled = process.env.X_PUBLISH_ENABLED === "true";
  const apiKey = process.env.X_API_KEY;
  const apiSecret = process.env.X_API_SECRET;
  const accessToken = process.env.X_ACCESS_TOKEN;
  const accessTokenSecret = process.env.X_ACCESS_TOKEN_SECRET;
  const posts = draft.locales[locale].posts;

  if (!enabled) {
    return {
      mode: "draft-only",
      published: false,
      reason: "X publishing is disabled. Draft generated successfully.",
    } as const;
  }

  if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
    throw new Error("X environment variables are missing.");
  }

  const twitter = new TwitterApi({
    appKey: apiKey,
    appSecret: apiSecret,
    accessToken,
    accessSecret: accessTokenSecret,
  });

  let mediaId: string | null = null;
  const mediaPath = resolveSocialPublishMediaPath(draft);
  if (mediaPath) {
    try {
      mediaId = await uploadXMedia(twitter, mediaPath);
      console.log(`X media uploaded for ${draft.slug} (${draft.mediaSource ?? draft.sourceType})`);
    } catch (error) {
      console.warn(
        `X media upload failed for ${draft.slug}; posting text-only: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  let replyToTweetId: string | null = null;
  let rootTweetId: string | null = null;
  const publishedIds: string[] = [];

  for (const [index, text] of posts.entries()) {
    const payload: {
      text: string;
      reply?: { in_reply_to_tweet_id: string };
      media?: { media_ids: [string] };
    } = replyToTweetId
      ? {
          text,
          reply: {
            in_reply_to_tweet_id: replyToTweetId,
          },
        }
      : { text };

    // Attach cover only on the root tweet to avoid repeating media in the thread.
    if (index === 0 && mediaId) {
      payload.media = { media_ids: [mediaId] };
    }

    const result: { data?: { id?: string } } = await twitter.v2.tweet(payload);
    const tweetId: string | undefined = result.data?.id;

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
    mediaAttached: Boolean(mediaId),
    publishedUrl: rootTweetId ? `https://x.com/i/web/status/${rootTweetId}` : null,
  } as const;
}
