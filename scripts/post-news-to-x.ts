import { createClient } from "@supabase/supabase-js";
import { TwitterApi } from "twitter-api-v2";
import { getTagHashtag, BROAD_HASHTAGS } from "@/lib/tags";

const SITE_HOST = "michael.business";
const MAX_POSTS_PER_RUN = 3;
const TWEET_MAX_LENGTH = 280;

type NewsRow = {
  slug: string;
  source_name: string;
  locales: {
    en: { title: string; summary: string; whyItMatters: string };
    pt: { title: string; summary: string; whyItMatters: string };
  };
  tags: string[];
  editorial_analysis: { en: string; pt: string } | null;
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

  const { data: unposted, error: fetchError } = await supabase
    .from("news")
    .select("slug, source_name, locales, tags, editorial_analysis")
    .is("posted_to_x_at", null)
    .eq("is_active", true)
    .order("published_at", { ascending: false })
    .limit(MAX_POSTS_PER_RUN);

  if (fetchError) {
    console.error("ERROR: failed to query unposted news", fetchError.message);
    process.exit(1);
  }

  if (!unposted || unposted.length === 0) {
    console.log("No unposted news items found. Nothing to do.");
    return;
  }

  console.log(`Found ${unposted.length} unposted news items`);

  let posted = 0;

  for (let i = 0; i < unposted.length; i++) {
    const news = unposted[i] as NewsRow;
    const tweet = buildTweet(news, i);

    try {
      const result = await twitter.v2.tweet(tweet);
      console.log(`POSTED: ${news.slug} -> tweet id ${result.data.id}`);

      const { error: updateError } = await supabase
        .from("news")
        .update({ posted_to_x_at: new Date().toISOString() })
        .eq("slug", news.slug);

      if (updateError) {
        console.warn(`WARNING: posted tweet but failed to update Supabase for ${news.slug}: ${updateError.message}`);
      }

      posted += 1;
    } catch (tweetError: unknown) {
      const message = tweetError instanceof Error ? tweetError.message : "Unknown error";
      const details = tweetError && typeof tweetError === "object" && "data" in tweetError
        ? JSON.stringify((tweetError as Record<string, unknown>).data)
        : "";
      console.warn(`SKIPPED: ${news.slug} -- ${message}${details ? ` | details: ${details}` : ""}`);
    }
  }

  console.log(`SUCCESS: ${posted}/${unposted.length} news items posted to X`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
