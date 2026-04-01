import fs from "node:fs";
import path from "node:path";

import Anthropic from "@anthropic-ai/sdk";

import { resolveLinkedinAuthorUrn } from "@/lib/linkedin-author";
import { queryPostgres } from "@/lib/postgres";
import { toErrorMessage, withRetry, sleep } from "@/lib/runtime";

const MAX_REPLIES_PER_RUN = 3;
const MAX_POSTS_TO_CHECK = 10;
const MIN_DELAY_MS = 15_000;
const MAX_DELAY_MS = 45_000;
const LINKEDIN_API_BASE = "https://api.linkedin.com/v2";
const REPLIED_COMMENTS_FILE =
  process.env.REPLIED_COMMENTS_FILE || "/opt/michael-business/run/linkedin-replied-comments.json";

type LinkedInComment = {
  id: string;
  actor: string;
  message: { text: string };
  created: { time: number };
  parentComment?: string;
};

type RepliedCommentsState = {
  repliedIds: string[];
};

function readRepliedComments(): RepliedCommentsState {
  try {
    const content = fs.readFileSync(REPLIED_COMMENTS_FILE, "utf-8").trim();
    const parsed = JSON.parse(content) as RepliedCommentsState;
    return { repliedIds: Array.isArray(parsed.repliedIds) ? parsed.repliedIds : [] };
  } catch {
    return { repliedIds: [] };
  }
}

function saveRepliedComments(state: RepliedCommentsState): void {
  const dir = path.dirname(REPLIED_COMMENTS_FILE);
  fs.mkdirSync(dir, { recursive: true });
  const trimmed = { repliedIds: state.repliedIds.slice(-500) };
  fs.writeFileSync(REPLIED_COMMENTS_FILE, JSON.stringify(trimmed, null, 2), "utf-8");
}

function randomDelay(): number {
  return MIN_DELAY_MS + Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS));
}

function ensureUgcUrn(postId: string): string {
  if (postId.startsWith("urn:li:")) {
    return postId;
  }
  return `urn:li:ugcPost:${postId}`;
}

async function fetchComments(accessToken: string, postUrn: string): Promise<LinkedInComment[]> {
  const encodedUrn = encodeURIComponent(postUrn);
  const url = `${LINKEDIN_API_BASE}/socialActions/${encodedUrn}/comments?count=20`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "X-Restli-Protocol-Version": "2.0.0",
    },
  });

  if (response.status === 403) {
    console.warn(`WARN: 403 fetching comments for ${postUrn} (insufficient permissions)`);
    return [];
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`LinkedIn comments API ${response.status}: ${body}`);
  }

  const data = (await response.json()) as { elements?: LinkedInComment[] };
  return data.elements ?? [];
}

async function postReply(
  accessToken: string,
  postUrn: string,
  actorUrn: string,
  parentCommentUrn: string,
  text: string,
): Promise<string> {
  const encodedUrn = encodeURIComponent(postUrn);
  const url = `${LINKEDIN_API_BASE}/socialActions/${encodedUrn}/comments`;

  const body = {
    actor: actorUrn,
    message: { text },
    parentComment: parentCommentUrn,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LinkedIn reply API ${response.status}: ${error}`);
  }

  const result = (await response.json()) as { id?: string };
  return result.id ?? response.headers.get("x-restli-id") ?? "unknown";
}

function buildReplyPrompt(commentText: string, postTitle: string): string {
  return `You are Michael Santos, a data engineer responding to a LinkedIn comment on your article "${postTitle}".

Comment: "${commentText}"

Write a professional, thoughtful reply. Rules:
- Respond as a data engineering expert
- Be concise, helpful, and add real value
- Never be generic (no "thanks for reading!" or "appreciate your comment!")
- Match the language of the comment (English or Portuguese)
- Stay under 500 characters
- Include a relevant insight or ask a follow-up question to drive conversation
- Sound human, not like a bot
- Do NOT include hashtags

Return ONLY the reply text, nothing else.`;
}

async function getRecentLinkedInPosts(): Promise<Array<{ slug: string; linkedin_external_post_id: string; title: string }>> {
  const { rows } = await queryPostgres<{
    slug: string;
    linkedin_external_post_id: string;
    locales: { en?: { title?: string }; pt?: { title?: string } };
  }>(
    `SELECT slug, linkedin_external_post_id, locales
     FROM public.news
     WHERE is_active = true
       AND linkedin_external_post_id IS NOT NULL
       AND posted_to_linkedin_at > NOW() - INTERVAL '7 days'
     ORDER BY posted_to_linkedin_at DESC
     LIMIT $1`,
    [MAX_POSTS_TO_CHECK],
  );

  return rows.map((row) => ({
    slug: row.slug,
    linkedin_external_post_id: row.linkedin_external_post_id,
    title: row.locales?.en?.title ?? row.locales?.pt?.title ?? row.slug,
  }));
}

async function main(): Promise<void> {
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!accessToken) {
    console.error("ERROR: LINKEDIN_ACCESS_TOKEN must be set");
    process.exit(1);
  }

  if (!anthropicKey) {
    console.error("ERROR: ANTHROPIC_API_KEY must be set");
    process.exit(1);
  }

  let author: ReturnType<typeof resolveLinkedinAuthorUrn>;
  try {
    author = resolveLinkedinAuthorUrn(process.env);
  } catch {
    console.error("ERROR: LINKEDIN_PERSON_URN or LINKEDIN_ORGANIZATION_URN must be set");
    process.exit(1);
  }

  const anthropic = new Anthropic({ apiKey: anthropicKey });
  const state = readRepliedComments();
  const repliedSet = new Set(state.repliedIds);

  const posts = await getRecentLinkedInPosts();

  if (posts.length === 0) {
    console.log("No recent LinkedIn posts found. Nothing to do.");
    return;
  }

  console.log(`Checking comments on ${posts.length} recent LinkedIn posts`);

  let totalReplied = 0;

  for (const post of posts) {
    if (totalReplied >= MAX_REPLIES_PER_RUN) {
      break;
    }

    const postUrn = ensureUgcUrn(post.linkedin_external_post_id);

    let comments: LinkedInComment[];
    try {
      comments = await withRetry(() => fetchComments(accessToken, postUrn), {
        attempts: 3,
        delayMs: 2_000,
        shouldRetry: (error) => {
          const msg = toErrorMessage(error);
          return msg.includes("429") || msg.includes("503") || msg.includes("timeout");
        },
        onRetry: (error, attempt, nextDelayMs) => {
          console.warn(`Retrying comments fetch for ${post.slug} after attempt ${attempt}: ${toErrorMessage(error)} (next in ${nextDelayMs}ms)`);
        },
      });
    } catch (fetchError) {
      console.warn(`SKIPPED: ${post.slug} -- failed to fetch comments: ${toErrorMessage(fetchError)}`);
      continue;
    }

    const eligibleComments = comments
      .filter((c) => c.actor !== author.authorUrn)
      .filter((c) => !c.parentComment)
      .filter((c) => !repliedSet.has(c.id));

    if (eligibleComments.length === 0) {
      console.log(`No new comments on "${post.slug}"`);
      continue;
    }

    console.log(`Found ${eligibleComments.length} new comments on "${post.slug}"`);

    for (const comment of eligibleComments) {
      if (totalReplied >= MAX_REPLIES_PER_RUN) {
        break;
      }

      const prompt = buildReplyPrompt(comment.message.text, post.title);

      try {
        const message = await withRetry(
          () =>
            anthropic.messages.create({
              model: "claude-haiku-4-5-20251001",
              max_tokens: 256,
              messages: [{ role: "user", content: prompt }],
            }),
          {
            attempts: 3,
            delayMs: 1_500,
            shouldRetry: (error) => {
              const msg = toErrorMessage(error);
              return msg.includes("rate") || msg.includes("overloaded") || msg.includes("timeout") || msg.includes("529");
            },
            onRetry: (error, attempt, nextDelayMs) => {
              console.warn(`Retrying Claude reply for comment ${comment.id} after attempt ${attempt}: ${toErrorMessage(error)} (next in ${nextDelayMs}ms)`);
            },
          },
        );

        const textBlock = message.content.find((block) => block.type === "text");
        if (!textBlock || textBlock.type !== "text") {
          console.warn(`SKIPPED: comment ${comment.id} -- no text in Claude response`);
          continue;
        }

        let replyText = textBlock.text.trim();
        if (replyText.length > 500) {
          replyText = `${replyText.slice(0, 499).trimEnd()}…`;
          console.warn(`WARNING: reply truncated to 500 chars for comment ${comment.id}`);
        }

        await withRetry(
          () => postReply(accessToken, postUrn, author.authorUrn, comment.id, replyText),
          {
            attempts: 3,
            delayMs: 2_000,
            shouldRetry: (error) => {
              const msg = toErrorMessage(error);
              return msg.includes("429") || msg.includes("503") || msg.includes("timeout");
            },
            onRetry: (error, attempt, nextDelayMs) => {
              console.warn(`Retrying LinkedIn reply for comment ${comment.id} after attempt ${attempt}: ${toErrorMessage(error)} (next in ${nextDelayMs}ms)`);
            },
          },
        );

        repliedSet.add(comment.id);
        totalReplied += 1;
        console.log(`REPLIED: comment ${comment.id} on "${post.slug}" -> "${replyText.slice(0, 80)}..."`);

        if (totalReplied < MAX_REPLIES_PER_RUN) {
          const delay = randomDelay();
          console.log(`Waiting ${Math.round(delay / 1000)}s before next reply`);
          await sleep(delay);
        }
      } catch (replyError: unknown) {
        console.warn(`SKIPPED: comment ${comment.id} -- ${toErrorMessage(replyError)}`);
      }
    }
  }

  saveRepliedComments({ repliedIds: [...repliedSet] });
  console.log(`SUCCESS: ${totalReplied} LinkedIn comments replied to`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
