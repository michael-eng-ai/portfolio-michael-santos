import { createClient } from "@supabase/supabase-js";

const SITE_HOST = "michael.business";
const MAX_POSTS_PER_RUN = 1;
const LINKEDIN_API_BASE = "https://api.linkedin.com/v2";

type ArticleRow = {
  slug: string;
  locales: {
    en: { title: string; summary: string; body: string };
    pt: { title: string; summary: string; body: string };
  };
  tags: string[];
  published_at: string;
  posted_to_linkedin_at: string | null;
};

function buildLinkedInPost(article: ArticleRow): string {
  const content = article.locales.en;
  const url = `https://${SITE_HOST}/en/articles/${article.slug}`;

  const firstParagraph = content.body
    .split("\n\n")
    .find((p) => p.length > 80 && !p.startsWith("#"));

  const excerpt = firstParagraph
    ? firstParagraph.slice(0, 250).trimEnd() + (firstParagraph.length > 250 ? "..." : "")
    : content.summary.slice(0, 250);

  const hashtags = article.tags
    .slice(0, 4)
    .map((t) => `#${t.replace(/[\s-]/g, "")}`)
    .join(" ");

  return `${content.title}\n\n${excerpt}\n\nRead the full analysis:\n${url}\n\n${hashtags} #DataEngineering`;
}

async function postToLinkedIn(accessToken: string, personUrn: string, text: string): Promise<string> {
  const body = {
    author: `urn:li:person:${personUrn}`,
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
  const personUrn = process.env.LINKEDIN_PERSON_URN;

  if (!supabaseUrl || !supabaseKey || !accessToken || !personUrn) {
    console.error("ERROR: Missing required env vars (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, LINKEDIN_ACCESS_TOKEN, LINKEDIN_PERSON_URN)");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: unposted, error: fetchError } = await supabase
    .from("articles")
    .select("slug, locales, tags, published_at, posted_to_linkedin_at")
    .is("posted_to_linkedin_at", null)
    .order("published_at", { ascending: false })
    .limit(MAX_POSTS_PER_RUN);

  if (fetchError) {
    console.error("ERROR fetching articles:", fetchError.message);
    process.exit(1);
  }

  if (!unposted || unposted.length === 0) {
    console.log("No unposted articles found");
    return;
  }

  console.log(`Found ${unposted.length} unposted articles`);

  let posted = 0;

  for (const article of unposted as ArticleRow[]) {
    const text = buildLinkedInPost(article);

    try {
      const postId = await postToLinkedIn(accessToken, personUrn, text);
      console.log(`POSTED: ${article.slug} -> LinkedIn post ${postId}`);

      const { error: updateError } = await supabase
        .from("articles")
        .update({ posted_to_linkedin_at: new Date().toISOString() })
        .eq("slug", article.slug);

      if (updateError) {
        console.warn(`WARNING: posted but failed to update Supabase for ${article.slug}: ${updateError.message}`);
      }

      posted += 1;
    } catch (postError: unknown) {
      const message = postError instanceof Error ? postError.message : "Unknown error";
      console.warn(`SKIPPED: ${article.slug} -- ${message}`);
    }
  }

  console.log(`SUCCESS: ${posted}/${unposted.length} articles posted to LinkedIn`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
