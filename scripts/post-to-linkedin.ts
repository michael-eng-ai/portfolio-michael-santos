import { createClient } from "@supabase/supabase-js";

import { resolveLinkedinAuthorUrn } from "@/lib/linkedin-author";
import {
  buildDeliveryFailurePatch,
  buildDeliverySelectColumns,
  buildDeliveryStartPatch,
  buildDeliverySuccessPatch,
  selectDueDeliveryRows,
  supportsDeliveryQueue,
} from "@/lib/news-delivery";
import { toErrorMessage, withRetry } from "@/lib/runtime";

const SITE_HOST = "michael.business";
const MAX_POSTS_PER_RUN = 1;
const LINKEDIN_API_BASE = "https://api.linkedin.com/v2";

type NewsRow = Record<string, unknown> & {
  slug: string;
  source_name: string;
  locales: {
    en: { title: string; summary: string; whyItMatters: string };
    pt: { title: string; summary: string; whyItMatters: string };
  };
  tags: string[];
  editorial_analysis: { en: string; pt: string } | null;
  published_at: string;
  posted_to_linkedin_at: string | null;
  linkedin_attempt_count?: number | null;
};

function buildLinkedInPost(news: NewsRow): string {
  const content = news.locales.en;
  const url = `https://${SITE_HOST}/en/news/${news.slug}`;

  const editorial = news.editorial_analysis?.en;
  const excerpt = editorial
    ? editorial.split("\n\n")[0].slice(0, 280)
    : content.summary.slice(0, 280);

  const hashtags = news.tags
    .slice(0, 4)
    .map((t) => `#${t.replace(/[\s-]/g, "")}`)
    .join(" ");

  return `${content.title}\n\n${excerpt}\n\nRead the full analysis:\n${url}\n\n${hashtags} #DataEngineering`;
}

async function postToLinkedIn(accessToken: string, authorUrn: string, text: string): Promise<string> {
  const body = {
    author: authorUrn,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text },
        shareMediaCategory: "NONE",
      },
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
    },
  };

  const response = await fetch(`${LINKEDIN_API_BASE}/ugcPosts`, {
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
    throw new Error(`LinkedIn API ${response.status}: ${error}`);
  }

  const postId = response.headers.get("x-restli-id") ?? "unknown";
  return postId;
}

async function main(): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
  let author: ReturnType<typeof resolveLinkedinAuthorUrn> | null = null;

  if (accessToken) {
    try {
      author = resolveLinkedinAuthorUrn(process.env);
    } catch {
      author = null;
    }
  }

  if (!supabaseUrl || !supabaseKey || !accessToken || !author) {
    console.error("ERROR: Missing required env vars (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, LINKEDIN_ACCESS_TOKEN, LINKEDIN_PERSON_URN or LINKEDIN_ORGANIZATION_URN)");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: sampleRows, error: sampleError } = await supabase
    .from("news")
    .select("*")
    .eq("is_active", true)
    .limit(1);

  if (sampleError) {
    console.error("ERROR: failed to inspect LinkedIn delivery schema", sampleError.message);
    process.exit(1);
  }

  const queueSupported = supportsDeliveryQueue((sampleRows ?? [])[0] as Record<string, unknown> | undefined, "linkedin");
  const selectColumns = queueSupported
    ? buildDeliverySelectColumns("linkedin", ["slug", "source_name", "locales", "tags", "editorial_analysis", "published_at", "posted_to_linkedin_at"])
    : "slug, source_name, locales, tags, editorial_analysis, published_at, posted_to_linkedin_at";

  const { data: unposted, error: fetchError } = await supabase
    .from("news")
    .select(selectColumns)
    .is("posted_to_linkedin_at", null)
    .not("editorial_analysis", "is", null)
    .eq("is_active", true)
    .order("published_at", { ascending: true })
    .limit(queueSupported ? 25 : MAX_POSTS_PER_RUN);

  if (fetchError) {
    console.error("ERROR fetching news:", fetchError.message);
    process.exit(1);
  }

  if (!unposted || unposted.length === 0) {
    console.log("No unposted news found");
    return;
  }

  const candidates = queueSupported
    ? selectDueDeliveryRows(unposted as unknown as NewsRow[], "linkedin", MAX_POSTS_PER_RUN)
    : (unposted as unknown as NewsRow[]);

  if (candidates.length === 0) {
    console.log("No due LinkedIn delivery items found");
    return;
  }

  console.log(`Found ${candidates.length} due LinkedIn delivery items`);

  let posted = 0;

  for (const article of candidates) {
    const text = buildLinkedInPost(article);
    const nextAttemptCount = Number(article.linkedin_attempt_count ?? 0) + 1;

    if (queueSupported) {
      const { error: startError } = await supabase
        .from("news")
        .update(buildDeliveryStartPatch("linkedin", nextAttemptCount))
        .eq("slug", article.slug);

      if (startError) {
        console.warn(`SKIPPED: ${article.slug} -- failed to mark LinkedIn delivery attempt: ${startError.message}`);
        continue;
      }
    }

    try {
      const postId = await withRetry(
        () => postToLinkedIn(accessToken, author.authorUrn, text),
        {
          attempts: 3,
          delayMs: 1_500,
          shouldRetry: (error) => {
            const message = toErrorMessage(error);
            return message.includes("429") || message.includes("5") || message.includes("timeout");
          },
          onRetry: (error, attempt, nextDelayMs) => {
            console.warn(`Retrying LinkedIn publish for ${article.slug} after attempt ${attempt}: ${toErrorMessage(error)} (next in ${nextDelayMs}ms)`);
          },
        },
      );
      console.log(`POSTED: ${article.slug} -> LinkedIn post ${postId}`);

      const successPatch = queueSupported
        ? buildDeliverySuccessPatch("linkedin", nextAttemptCount, postId)
        : { posted_to_linkedin_at: new Date().toISOString() };

      const { error: updateError } = await withRetry(
        async () =>
          await supabase
            .from("news")
            .update(successPatch)
            .eq("slug", article.slug),
        {
          attempts: 5,
          delayMs: 500,
        },
      );

      if (updateError) {
        console.warn(`WARNING: posted but failed to persist LinkedIn delivery state for ${article.slug}: ${updateError.message}`);
      }

      posted += 1;
    } catch (postError: unknown) {
      const message = toErrorMessage(postError);

      if (queueSupported) {
        const { error: failureUpdateError } = await withRetry(
          async () =>
            await supabase
              .from("news")
              .update(buildDeliveryFailurePatch("linkedin", nextAttemptCount, message))
              .eq("slug", article.slug),
          {
            attempts: 3,
            delayMs: 500,
          },
        );

        if (failureUpdateError) {
          console.warn(`WARNING: failed to persist LinkedIn retry state for ${article.slug}: ${failureUpdateError.message}`);
        }
      }

      console.warn(`SKIPPED: ${article.slug} -- ${message}`);
    }
  }

  console.log(`SUCCESS: ${posted}/${candidates.length} news posted to LinkedIn via ${author.mode}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
