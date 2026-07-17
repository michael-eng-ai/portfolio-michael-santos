import {
  claimDeliveryRow,
  getActiveNewsSampleRow,
  getRequiredWriteDatabaseEnvKeys,
  listPendingNewsRowsForDelivery,
  updateNewsRowBySlug,
} from "@/lib/database";
import { resolveLinkedinAuthorUrn } from "@/lib/linkedin-author";
import { buildLinkedinUgcShareContent } from "@/lib/linkedin";
import {
  buildDeliveryFailurePatch, buildDeliverySuccessPatch, selectDueDeliveryRows, supportsDeliveryQueue,
} from "@/lib/news-delivery";
import { toErrorMessage, withRetry } from "@/lib/runtime";
import { Locale } from "@/lib/site";
import { buildLocalizedSiteUrl, resolveSocialLocale } from "@/lib/utm";

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

function resolvePostLocale(): Locale {
  return resolveSocialLocale(process.env.NEWS_LINKEDIN_LOCALE, "pt");
}

function buildLinkedInPost(news: NewsRow, locale: Locale): {
  text: string;
  articleUrl: string;
  title: string;
  description: string;
} {
  const content = news.locales[locale] ?? news.locales.pt ?? news.locales.en;
  const articleUrl = buildLocalizedSiteUrl({
    locale,
    path: `/news/${news.slug}`,
    source: "linkedin",
    campaign: news.slug,
  });

  const editorial = news.editorial_analysis?.[locale] ?? news.editorial_analysis?.pt ?? news.editorial_analysis?.en;
  const excerpt = editorial
    ? editorial.split("\n\n")[0].slice(0, 350)
    : content.summary.slice(0, 350);

  const hashtags = news.tags
    .slice(0, 4)
    .map((t) => `#${t.replace(/[\s-]/g, "")}`)
    .join(" ");

  const cta = locale === "pt" ? "Leia a analise completa:" : "Read the full analysis:";

  return {
    text: `${content.title}\n\n${excerpt}\n\n${cta}\n${articleUrl}\n\n${hashtags} #DataEngineering`,
    articleUrl,
    title: content.title,
    description: excerpt,
  };
}

async function postToLinkedIn(
  accessToken: string,
  authorUrn: string,
  post: ReturnType<typeof buildLinkedInPost>,
): Promise<string> {
  const body = {
    author: authorUrn,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": buildLinkedinUgcShareContent({
        commentary: post.text,
        articleUrl: post.articleUrl,
        title: post.title,
        description: post.description,
      }),
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

async function validateLinkedInToken(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(`${LINKEDIN_API_BASE}/userinfo`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (response.status === 401) {
      console.error(
        "CRITICAL: LinkedIn access token expired. Regenerate at https://www.linkedin.com/developers/apps/",
      );
      return false;
    }

    if (response.status === 403) {
      console.warn("LinkedIn /userinfo returned 403 (missing profile read scope) -- proceeding with post attempt");
      return true;
    }

    if (!response.ok) {
      console.warn(`LinkedIn token check returned ${response.status} -- proceeding with post attempt`);
      return true;
    }

    return true;
  } catch (error) {
    console.warn(`LinkedIn token check failed: ${toErrorMessage(error)} -- proceeding with post attempt`);
    return true;
  }
}

async function main(): Promise<void> {
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
  const missingDatabaseEnv = getRequiredWriteDatabaseEnvKeys().filter((key) => !process.env[key]);
  let author: ReturnType<typeof resolveLinkedinAuthorUrn> | null = null;

  if (accessToken) {
    try {
      author = resolveLinkedinAuthorUrn(process.env);
    } catch {
      author = null;
    }
  }

  if (missingDatabaseEnv.length > 0 || !accessToken || !author) {
    console.error(`ERROR: Missing required env vars (${[...missingDatabaseEnv, "LINKEDIN_ACCESS_TOKEN", "LINKEDIN_PERSON_URN or LINKEDIN_ORGANIZATION_URN"].join(", ")})`);
    process.exit(1);
  }

  const tokenValid = await validateLinkedInToken(accessToken);
  if (!tokenValid) {
    process.exit(1);
  }

  const postLocale = resolvePostLocale();
  const sampleRow = await getActiveNewsSampleRow();
  const queueSupported = supportsDeliveryQueue(sampleRow as Record<string, unknown> | undefined, "linkedin");
  const unposted = await listPendingNewsRowsForDelivery("linkedin", queueSupported ? 25 : MAX_POSTS_PER_RUN, {
    requireEditorial: true,
  });

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

  console.log(`Found ${candidates.length} due LinkedIn delivery items (locale=${postLocale})`);

  let posted = 0;

  for (const article of candidates) {
    const post = buildLinkedInPost(article, postLocale);
    const nextAttemptCount = Number(article.linkedin_attempt_count ?? 0) + 1;

    if (queueSupported) {
      let claimed = false;
      try {
        claimed = await claimDeliveryRow("linkedin", article.slug, nextAttemptCount);
      } catch (startError) {
        console.warn(`SKIPPED: ${article.slug} -- failed to claim LinkedIn delivery attempt: ${toErrorMessage(startError)}`);
        continue;
      }
      if (!claimed) {
        console.log(`SKIPPED: ${article.slug} -- LinkedIn delivery already claimed by another run`);
        continue;
      }
    }

    try {
      const postId = await withRetry(
        () => postToLinkedIn(accessToken, author.authorUrn, post),
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

      try {
        await withRetry(
          () => updateNewsRowBySlug(article.slug, successPatch),
          {
            attempts: 5,
            delayMs: 500,
          },
        );
      } catch (updateError) {
        console.warn(`WARNING: posted but failed to persist LinkedIn delivery state for ${article.slug}: ${toErrorMessage(updateError)}`);
      }

      posted += 1;
    } catch (postError: unknown) {
      const message = toErrorMessage(postError);

      if (queueSupported) {
        try {
          await withRetry(
            () => updateNewsRowBySlug(article.slug, buildDeliveryFailurePatch("linkedin", nextAttemptCount, message)),
            {
              attempts: 3,
              delayMs: 500,
            },
          );
        } catch (failureUpdateError) {
          console.warn(`WARNING: failed to persist LinkedIn retry state for ${article.slug}: ${toErrorMessage(failureUpdateError)}`);
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
