import { createClient } from "@supabase/supabase-js";
import { TwitterApi } from "twitter-api-v2";

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
};

const hookTemplates = [
  (title: string) => `${title}`,
  (title: string) => `Worth reading: ${title}`,
  (title: string) => `New signal from the data frontier: ${title}`,
  (_title: string, source: string) => `${source} just published something worth your attention.`,
  (title: string) => `This changes how we think about pipelines: ${title}`,
  (_title: string, source: string) => `Fresh from ${source} -- and it matters for your data stack.`,
];

const tagToHashtag: Record<string, string> = {
  ai: "#AI",
  lakehouse: "#Lakehouse",
  dbt: "#dbt",
  kafka: "#Kafka",
  governance: "#DataGovernance",
  snowflake: "#Snowflake",
  bigquery: "#BigQuery",
  databricks: "#Databricks",
  streaming: "#Streaming",
};

function buildHashtags(tags: string[]): string {
  const mapped = tags
    .map((tag) => tagToHashtag[tag])
    .filter(Boolean)
    .slice(0, 3);

  if (!mapped.includes("#DataEngineering")) {
    mapped.unshift("#DataEngineering");
  }

  return mapped.slice(0, 4).join(" ");
}

function buildTweet(news: NewsRow, index: number): string {
  const url = `https://${SITE_HOST}/en/news/${news.slug}`;
  const hashtags = buildHashtags(news.tags);
  const hookFn = hookTemplates[index % hookTemplates.length];
  const hook = hookFn(news.locales.en.title, news.source_name);

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
    .select("slug, source_name, locales, tags")
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
