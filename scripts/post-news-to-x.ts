import { createClient } from "@supabase/supabase-js";
import { TwitterApi } from "twitter-api-v2";

import {
  buildDeliveryFailurePatch,
  buildDeliverySelectColumns,
  buildDeliveryStartPatch,
  buildDeliverySuccessPatch,
  selectDueDeliveryRows,
  supportsDeliveryQueue,
} from "@/lib/news-delivery";
import { toErrorMessage, withRetry } from "@/lib/runtime";
import { getTagHashtag, BROAD_HASHTAGS } from "@/lib/tags";

const SITE_HOST = "michael.business";
const MAX_POSTS_PER_RUN = 3;
const TWEET_MAX_LENGTH = 280;

type NewsRow = Record<string, unknown> & {
  slug: string;
  source_name: string;
  published_at?: string;
  posted_to_x_at?: string | null;
  locales: {
    en: { title: string; summary: string; whyItMatters: string };
    pt: { title: string; summary: string; whyItMatters: string };
  };
  tags: string[];
  editorial_analysis: { en: string; pt: string } | null;
  x_attempt_count?: number | null;
};

const hookTemplates = [
  (title: string) => `${title}`,
  (title: string) => `Worth reading: ${title}`,
  (_title: string, source: string) => `${source} just dropped something worth your attention.`,
  (title: string) => `Signal worth tracking: ${title}`,
  (_title: string, source: string) => `Fresh from ${source} -- relevant for your data stack.`,
  (title: string) => `If you missed this, catch up now: ${title}`,
  (title: string) => `This one caught my attention: ${title}`,
  (_title: string, source: string) => `New from ${source} -- bookmark this one.`,
];

function buildHashtags(tags: string[]): string {
  const specific = tags.map((tag) => getTagHashtag(tag));
  const unique = [...new Set(specific)].slice(0, 3);

  const broadPick = BROAD_HASHTAGS.find((h) => !unique.includes(h)) ?? "#DataEngineering";
  unique.push(broadPick);

  return unique.slice(0, 4).join(" ");
}

function extractEditorialHook(analysis: string): string {
  const firstSentence = analysis.split(/(?<=[.!?])\s+/)[0] ?? "";
  const secondSentence = analysis.split(/(?<=[.!?])\s+/)[1] ?? "";
  const hook = secondSentence ? `${firstSentence} ${secondSentence}` : firstSentence;
  return hook;
}

function buildTweet(news: NewsRow, index: number): string {
  const url = `https://${SITE_HOST}/en/news/${news.slug}`;
  const hashtags = buildHashtags(news.tags);

  let hook: string;
  if (news.editorial_analysis?.en) {
    hook = extractEditorialHook(news.editorial_analysis.en);
  } else {
    const hookFn = hookTemplates[index % hookTemplates.length];
    hook = hookFn(news.locales.en.title, news.source_name);
  }

  const suffix = `\n\n${url}\n\n${hashtags}`;
  const availableForHook = TWEET_MAX_LENGTH - suffix.length;

  const trimmedHook =
    hook.length <= availableForHook
      ? hook
      : `${hook.slice(0, availableForHook - 1).trimEnd()}…`;

  return `${trimmedHook}${suffix}`;
}

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const apiKey = process.env.X_API_KEY;
  const apiSecret = process.env.X_API_SECRET;
  const accessToken = process.env.X_ACCESS_TOKEN;
  const accessTokenSecret = process.env.X_ACCESS_TOKEN_SECRET;

  if (!supabaseUrl || !supabaseKey) {
    console.error("ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
    process.exit(1);
  }

  if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
    console.error("ERROR: X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET must be set");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const twitter = new TwitterApi({
    appKey: apiKey,
    appSecret: apiSecret,
    accessToken,
    accessSecret: accessTokenSecret,
  });

  const { data: sampleRows, error: sampleError } = await supabase
    .from("news")
    .select("*")
    .eq("is_active", true)
    .limit(1);

  if (sampleError) {
    console.error("ERROR: failed to inspect news delivery schema", sampleError.message);
    process.exit(1);
  }

  const queueSupported = supportsDeliveryQueue((sampleRows ?? [])[0] as Record<string, unknown> | undefined, "x");
  const selectColumns = queueSupported
    ? buildDeliverySelectColumns("x", ["slug", "source_name", "published_at", "locales", "tags", "editorial_analysis"])
    : "slug, source_name, published_at, posted_to_x_at, locales, tags, editorial_analysis";

  const { data: unposted, error: fetchError } = await supabase
    .from("news")
    .select(selectColumns)
    .eq("is_active", true)
    .is("posted_to_x_at", null)
    .order("published_at", { ascending: true })
    .limit(queueSupported ? 50 : MAX_POSTS_PER_RUN);

  if (fetchError) {
    console.error("ERROR: failed to query unposted news", fetchError.message);
    process.exit(1);
  }

  if (!unposted || unposted.length === 0) {
    console.log("No unposted news items found. Nothing to do.");
    return;
  }

  const candidates = queueSupported
    ? selectDueDeliveryRows(unposted as unknown as NewsRow[], "x", MAX_POSTS_PER_RUN)
    : (unposted as unknown as NewsRow[]);

  if (candidates.length === 0) {
    console.log("No due X delivery items found. Nothing to do.");
    return;
  }

  console.log(`Found ${candidates.length} due X delivery items`);

  let posted = 0;

  for (let i = 0; i < candidates.length; i++) {
    const news = candidates[i];
    const tweet = buildTweet(news, i);
    const nextAttemptCount = Number(news.x_attempt_count ?? 0) + 1;

    if (queueSupported) {
      const { error: startError } = await supabase
        .from("news")
        .update(buildDeliveryStartPatch("x", nextAttemptCount))
        .eq("slug", news.slug);

      if (startError) {
        console.warn(`SKIPPED: ${news.slug} -- failed to mark X delivery attempt: ${startError.message}`);
        continue;
      }
    }

    try {
      const result = await withRetry(
        () => twitter.v2.tweet(tweet),
        {
          attempts: 3,
          delayMs: 1_500,
          shouldRetry: (error) => {
            const message = toErrorMessage(error);
            return message.includes("429") || message.includes("503") || message.includes("timeout") || message.includes("ECONNRESET");
          },
          onRetry: (error, attempt, nextDelayMs) => {
            console.warn(`Retrying X publish for ${news.slug} after attempt ${attempt}: ${toErrorMessage(error)} (next in ${nextDelayMs}ms)`);
          },
        },
      );
      console.log(`POSTED: ${news.slug} -> tweet id ${result.data.id}`);

      const successPatch = queueSupported
        ? buildDeliverySuccessPatch("x", nextAttemptCount, result.data.id)
        : { posted_to_x_at: new Date().toISOString() };

      const { error: updateError } = await withRetry(
        async () =>
          await supabase
            .from("news")
            .update(successPatch)
            .eq("slug", news.slug),
        {
          attempts: 5,
          delayMs: 500,
        },
      );

      if (updateError) {
        console.warn(`WARNING: posted tweet but failed to persist X delivery state for ${news.slug}: ${updateError.message}`);
      }

      posted += 1;
    } catch (tweetError: unknown) {
      const message = toErrorMessage(tweetError);
      const details = tweetError && typeof tweetError === "object" && "data" in tweetError
        ? JSON.stringify((tweetError as Record<string, unknown>).data)
        : "";

      if (queueSupported) {
        const { error: failureUpdateError } = await withRetry(
          async () =>
            await supabase
              .from("news")
              .update(buildDeliveryFailurePatch("x", nextAttemptCount, `${message}${details ? ` | ${details}` : ""}`))
              .eq("slug", news.slug),
          {
            attempts: 3,
            delayMs: 500,
          },
        );

        if (failureUpdateError) {
          console.warn(`WARNING: failed to persist X retry state for ${news.slug}: ${failureUpdateError.message}`);
        }
      }

      console.warn(`SKIPPED: ${news.slug} -- ${message}${details ? ` | details: ${details}` : ""}`);
    }
  }

  console.log(`SUCCESS: ${posted}/${candidates.length} news items posted to X`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
