import fs from "node:fs";
import path from "node:path";

import { TwitterApi } from "twitter-api-v2";

import { generateText, resolveLlmProvider } from "@/lib/llm-text";
import { toErrorMessage, withRetry, sleep } from "@/lib/runtime";

const MAX_REPLIES_PER_RUN = 5;
const MIN_DELAY_MS = 30_000;
const MAX_DELAY_MS = 90_000;
const OWN_USER_ID = "1439707969202147330";
const LAST_MENTION_FILE =
  process.env.LAST_MENTION_FILE || "/opt/michael-business/run/last-mention-id.txt";

type Mention = {
  id: string;
  text: string;
  author_id?: string;
  referenced_tweets?: { type: string; id: string }[];
};

function readLastMentionId(): string | undefined {
  try {
    const content = fs.readFileSync(LAST_MENTION_FILE, "utf-8").trim();
    return content || undefined;
  } catch {
    return undefined;
  }
}

function saveLastMentionId(mentionId: string): void {
  const dir = path.dirname(LAST_MENTION_FILE);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(LAST_MENTION_FILE, mentionId, "utf-8");
}

function isRetweet(mention: Mention): boolean {
  return mention.referenced_tweets?.some((ref) => ref.type === "retweeted") ?? false;
}

function randomDelay(): number {
  return MIN_DELAY_MS + Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS));
}

function buildReplyPrompt(mentionText: string): string {
  return `You are @data_insight_ai, a data engineering expert on X/Twitter. Someone mentioned you in this tweet:

"${mentionText}"

Write a professional, helpful reply. Rules:
- Respond as a data engineering expert
- Be concise, helpful, and add real value
- Never be generic (no "thanks for sharing!" or "great point!")
- Match the language of the mention (English or Portuguese)
- Stay under 280 characters total
- Include a relevant insight, suggestion, or thoughtful question to drive conversation
- Do NOT include hashtags
- Do NOT start with "Great question" or similar filler

Return ONLY the reply text, nothing else.`;
}

async function main(): Promise<void> {
  const apiKey = process.env.X_API_KEY;
  const apiSecret = process.env.X_API_SECRET;
  const accessToken = process.env.X_ACCESS_TOKEN;
  const accessTokenSecret = process.env.X_ACCESS_TOKEN_SECRET;

  if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
    console.error("ERROR: X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET must be set");
    process.exit(1);
  }

  let provider;
  try {
    provider = resolveLlmProvider();
  } catch (error) {
    console.error(`ERROR: ${toErrorMessage(error)}`);
    process.exit(1);
  }
  console.log(`Using LLM provider: ${provider}`);

  const twitter = new TwitterApi({
    appKey: apiKey,
    appSecret: apiSecret,
    accessToken,
    accessSecret: accessTokenSecret,
  });

  const lastMentionId = readLastMentionId();
  console.log(lastMentionId ? `Fetching mentions since ${lastMentionId}` : "Fetching recent mentions (first run)");

  const mentionsResponse = await withRetry(
    () =>
      twitter.v2.userMentionTimeline(OWN_USER_ID, {
        max_results: 20,
        since_id: lastMentionId,
        "tweet.fields": ["author_id", "referenced_tweets", "text"],
      }),
    {
      attempts: 3,
      delayMs: 2_000,
      shouldRetry: (error) => {
        const message = toErrorMessage(error);
        return message.includes("429") || message.includes("503") || message.includes("timeout") || message.includes("ECONNRESET");
      },
      onRetry: (error, attempt, nextDelayMs) => {
        console.warn(`Retrying mentions fetch after attempt ${attempt}: ${toErrorMessage(error)} (next in ${nextDelayMs}ms)`);
      },
    },
  );

  const mentions = (mentionsResponse.data?.data ?? []) as Mention[];

  if (mentions.length === 0) {
    console.log("No new mentions found. Nothing to do.");
    return;
  }

  console.log(`Found ${mentions.length} new mentions`);

  const eligibleMentions = mentions
    .filter((mention) => mention.author_id !== OWN_USER_ID)
    .filter((mention) => !isRetweet(mention))
    .slice(0, MAX_REPLIES_PER_RUN);

  if (eligibleMentions.length === 0) {
    console.log("No eligible mentions to reply to (all filtered out).");
    if (mentions.length > 0) {
      saveLastMentionId(mentions[0].id);
    }
    return;
  }

  console.log(`${eligibleMentions.length} eligible mentions to reply to`);

  let replied = 0;

  for (let i = 0; i < eligibleMentions.length; i++) {
    const mention = eligibleMentions[i];
    const prompt = buildReplyPrompt(mention.text);

    try {
      const result = await withRetry(
        () => generateText({ prompt, maxTokens: 256 }),
        {
          attempts: 3,
          delayMs: 1_500,
          shouldRetry: (error) => {
            const msg = toErrorMessage(error);
            return msg.includes("rate") || msg.includes("overloaded") || msg.includes("timeout") || msg.includes("529");
          },
          onRetry: (error, attempt, nextDelayMs) => {
            console.warn(`Retrying reply generation for mention ${mention.id} after attempt ${attempt}: ${toErrorMessage(error)} (next in ${nextDelayMs}ms)`);
          },
        },
      );

      let replyText = result.text.trim();

      if (replyText.length > 280) {
        replyText = `${replyText.slice(0, 279).trimEnd()}…`;
        console.warn(`WARNING: reply truncated to 280 chars for mention ${mention.id}`);
      }

      await withRetry(
        () =>
          twitter.v2.reply(replyText, mention.id),
        {
          attempts: 3,
          delayMs: 2_000,
          shouldRetry: (error) => {
            const msg = toErrorMessage(error);
            return msg.includes("429") || msg.includes("503") || msg.includes("timeout") || msg.includes("ECONNRESET");
          },
          onRetry: (error, attempt, nextDelayMs) => {
            console.warn(`Retrying X reply for mention ${mention.id} after attempt ${attempt}: ${toErrorMessage(error)} (next in ${nextDelayMs}ms)`);
          },
        },
      );

      console.log(`REPLIED: mention ${mention.id} by author ${mention.author_id} -> "${replyText.slice(0, 80)}..."`);
      replied += 1;

      if (i < eligibleMentions.length - 1) {
        const delay = randomDelay();
        console.log(`Waiting ${Math.round(delay / 1000)}s before next reply`);
        await sleep(delay);
      }
    } catch (replyError: unknown) {
      const message = toErrorMessage(replyError);
      const details =
        replyError && typeof replyError === "object" && "data" in replyError
          ? JSON.stringify((replyError as Record<string, unknown>).data)
          : "";
      console.warn(`SKIPPED: mention ${mention.id} -- ${message}${details ? ` | details: ${details}` : ""}`);
    }
  }

  const latestMentionId = mentions[0].id;
  saveLastMentionId(latestMentionId);
  console.log(`Saved last mention ID: ${latestMentionId}`);

  console.log(`SUCCESS: ${replied}/${eligibleMentions.length} mentions replied to`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
