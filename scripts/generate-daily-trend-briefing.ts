import { promises as fs } from "node:fs";
import path from "node:path";

import { jsonrepair } from "jsonrepair";
import Parser from "rss-parser";

import { getRequiredWriteDatabaseEnvKeys, listActiveNewsRows, upsertNewsRows } from "@/lib/database";
import { articleSchema, newsSchema } from "@/lib/content";
import { resolveNewsImage } from "@/lib/editorial-images";
import { generateText, resolveLlmProvider } from "@/lib/llm-text";
import { writeNewsSnapshot } from "@/lib/news-utils";
import { toErrorMessage, withRetry } from "@/lib/runtime";

const SITE_HOST = "michael.business";
const MIN_HEADLINES = 3;
const MAX_HEADLINES = 8;
const HEADLINE_MAX_AGE_HOURS = 48;

type TrendKeyword = {
  query: string;
  tags: string[];
  maxItems: number;
};

type Headline = {
  title: string;
  link: string;
  pubDate: string;
  tags: string[];
};

type BriefingContent = {
  titleEn: string;
  titlePt: string;
  summaryEn: string;
  summaryPt: string;
  whyItMattersEn: string;
  whyItMattersPt: string;
  editorialEn: string;
  editorialPt: string;
  tags: string[];
};

function todaySlug(): string {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  return `daily-trend-briefing-${yyyy}-${mm}-${dd}`;
}

function isRecent(pubDate: string | undefined): boolean {
  if (!pubDate) return false;
  const pub = new Date(pubDate);
  if (isNaN(pub.getTime())) return false;
  const now = new Date();
  const diffHours = (now.getTime() - pub.getTime()) / (1000 * 60 * 60);
  return diffHours <= HEADLINE_MAX_AGE_HOURS;
}

function buildGoogleNewsUrl(query: string): string {
  const encoded = encodeURIComponent(query);
  return `https://news.google.com/rss/search?q=${encoded}&hl=en-US&gl=US&ceid=US:en`;
}

async function fetchHeadlines(keywords: TrendKeyword[]): Promise<Headline[]> {
  const parser = new Parser({ timeout: 10000 });
  const seenUrls = new Set<string>();
  const headlines: Headline[] = [];

  for (const kw of keywords) {
    const url = buildGoogleNewsUrl(kw.query);

    try {
      const feed = await withRetry(
        () => parser.parseURL(url),
        {
          attempts: 3,
          delayMs: 1_000,
          shouldRetry: (error) => {
            const message = toErrorMessage(error);
            return message.includes("timeout") || message.includes("429") || message.includes("5");
          },
        },
      );
      let count = 0;

      for (const item of feed.items) {
        if (count >= kw.maxItems) break;
        if (!item.title || !item.link) continue;
        if (seenUrls.has(item.link)) continue;
        if (!isRecent(item.pubDate)) continue;

        seenUrls.add(item.link);
        headlines.push({
          title: item.title.replace(/ - .*$/, "").trim(),
          link: item.link,
          pubDate: item.pubDate ?? new Date().toISOString(),
          tags: kw.tags,
        });
        count++;
      }
    } catch (fetchError: unknown) {
      const msg = toErrorMessage(fetchError);
      console.warn(`WARNING: failed to fetch trends for "${kw.query}": ${msg}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  return headlines.slice(0, MAX_HEADLINES);
}

function buildPrompt(headlines: Headline[]): string {
  const headlineList = headlines
    .map((h, i) => `${i + 1}. ${h.title}`)
    .join("\n");

  const allTags = [...new Set(headlines.flatMap((h) => h.tags))];

  return `You are a senior data engineering consultant writing a daily trend briefing. Your audience is CTOs, data engineers, analytics engineers, and technical decision-makers who need to understand what is happening in the data and AI ecosystem TODAY.

TRENDING HEADLINES (from the last 48 hours):
${headlineList}

RELATED TOPICS: ${allTags.join(", ")}

INSTRUCTIONS:
Write a comprehensive daily trend briefing that:
1. Synthesizes these headlines into 2-3 key themes (do not analyze each headline individually)
2. Explains what these trends mean for data engineering teams in practice
3. Connects trends to architectural decisions, operational implications, or business strategy
4. Provides concrete takeaways or recommendations
5. Maintains a forward-looking perspective -- what should teams prepare for?

Write 300-400 words per language. Write in first person as a practicing senior data engineer.

RULES:
- Do NOT list or summarize individual headlines -- synthesize them into themes
- Be specific and opinionated, not generic
- Reference real technologies, patterns, and frameworks
- No bullet points -- write flowing paragraphs
- No introductory phrases like "Today's briefing covers..." -- jump straight into analysis
- Write ORIGINAL analysis, not a summary of the articles

FORMAT your response as JSON:
{
  "titleEn": "Daily Trend Briefing: [compelling theme in 8 words or less]",
  "titlePt": "Briefing de Tendencias: [same theme in Portuguese]",
  "summaryEn": "2-3 sentence summary of the key trends and their implications",
  "summaryPt": "Same summary in Brazilian Portuguese",
  "whyItMattersEn": "1-2 sentences on why data teams should pay attention today",
  "whyItMattersPt": "Same in Brazilian Portuguese",
  "editorialEn": "Full 300-400 word editorial analysis in English",
  "editorialPt": "Full 300-400 word editorial analysis in Brazilian Portuguese",
  "tags": ${JSON.stringify(allTags)}
}

Return ONLY the JSON object, no markdown fences or extra text.`;
}

function parseResponse(response: string): BriefingContent {
  const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  let parsed: BriefingContent;
  try {
    parsed = JSON.parse(cleaned) as BriefingContent;
  } catch {
    parsed = JSON.parse(jsonrepair(cleaned)) as BriefingContent;
  }

  const requiredFields: (keyof BriefingContent)[] = [
    "titleEn", "titlePt", "summaryEn", "summaryPt",
    "whyItMattersEn", "whyItMattersPt", "editorialEn", "editorialPt", "tags",
  ];

  for (const field of requiredFields) {
    if (!parsed[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  return parsed;
}

function estimateReadingMinutes(...paragraphs: string[]) {
  const wordCount = paragraphs
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;

  return Math.max(3, Math.ceil(wordCount / 200));
}

async function writeBriefingArticle(slug: string, briefing: BriefingContent, publishedAt: string) {
  const article = articleSchema.parse({
    slug,
    publishedAt: publishedAt.slice(0, 10),
    featured: false,
    category: {
      en: "Daily Trend Briefing",
      pt: "Briefing de Tendencias",
    },
    tags: briefing.tags,
    readingMinutes: estimateReadingMinutes(briefing.editorialEn, briefing.editorialPt),
    relatedProjectSlugs: [],
    relatedNewsSlugs: [],
    locales: {
      en: {
        title: briefing.titleEn,
        excerpt: briefing.summaryEn,
        body: briefing.editorialEn,
      },
      pt: {
        title: briefing.titlePt,
        excerpt: briefing.summaryPt,
        body: briefing.editorialPt,
      },
    },
  });

  const targetPath = path.join(process.cwd(), "content", "articles", `${slug}.json`);
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, `${JSON.stringify(article, null, 2)}\n`, "utf8");
  console.log(`ARTICLE: wrote canonical daily briefing to ${targetPath}`);
}

async function main(): Promise<void> {
  const missingDatabaseEnv = getRequiredWriteDatabaseEnvKeys().filter((key) => !process.env[key]);

  if (missingDatabaseEnv.length > 0) {
    console.error(`ERROR: Missing required database env vars: ${missingDatabaseEnv.join(", ")}`);
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

  const keywordsPath = path.resolve(process.cwd(), "content/sources/trend-keywords.json");
  const keywordsRaw = await fs.readFile(keywordsPath, "utf-8");
  const keywords = JSON.parse(keywordsRaw) as TrendKeyword[];

  console.log(`Fetching trends from ${keywords.length} keyword groups...`);
  const headlines = await fetchHeadlines(keywords);

  if (headlines.length < MIN_HEADLINES) {
    console.log(`Only ${headlines.length} headlines found (minimum: ${MIN_HEADLINES}). Skipping briefing.`);
    return;
  }

  console.log(`Collected ${headlines.length} trending headlines. Generating briefing...`);

  const prompt = buildPrompt(headlines);

  const result = await withRetry(
    () => generateText({ prompt, maxTokens: 2048 }),
    {
      attempts: 3,
      delayMs: 1_500,
      shouldRetry: (error) => {
        const message = toErrorMessage(error);
        return message.includes("rate") || message.includes("overloaded") || message.includes("timeout") || message.includes("529");
      },
    },
  );

  const briefing = parseResponse(result.text);
  const slug = todaySlug();
  const sourceUrl = `https://${SITE_HOST}/en/news/${slug}`;
  const nowIso = new Date().toISOString();
  const today = nowIso.slice(0, 10);

  await writeBriefingArticle(slug, briefing, nowIso);

  const row = {
    slug,
    published_at: nowIso,
    source_name: "Daily Trend Briefing",
    source_url: sourceUrl,
    image_url: resolveNewsImage({
      slug,
      imageUrl: null,
      sourceName: "Daily Trend Briefing",
      tags: briefing.tags,
      category: { en: "Trend Briefing", pt: "Briefing de Tendencias" },
    }),
    category: { en: "Trend Briefing", pt: "Briefing de Tendencias" },
    tags: briefing.tags,
    related_project_slugs: [],
    locales: {
      en: {
        title: briefing.titleEn,
        summary: briefing.summaryEn,
        whyItMatters: briefing.whyItMattersEn,
      },
      pt: {
        title: briefing.titlePt,
        summary: briefing.summaryPt,
        whyItMatters: briefing.whyItMattersPt,
      },
    },
    editorial_analysis: {
      en: briefing.editorialEn,
      pt: briefing.editorialPt,
    },
    is_active: true,
  };

  await upsertNewsRows([row]);

  try {
    const activeRows = await listActiveNewsRows();
    await writeNewsSnapshot(
      activeRows.map((row) =>
        newsSchema.parse({
          slug: row.slug,
          publishedAt: row.published_at,
          sourceName: row.source_name,
          sourceUrl: row.source_url,
          imageUrl: row.image_url,
          category: row.category,
          tags: row.tags,
          relatedProjectSlugs: row.related_project_slugs,
          editorialAnalysis: row.editorial_analysis ?? null,
          locales: row.locales,
        }),
      ),
    );
  } catch (snapshotError) {
    console.warn(`WARNING: failed to refresh news snapshot after daily briefing: ${toErrorMessage(snapshotError)}`);
  }

  console.log(`PUBLISHED: ${slug}`);
  console.log(`  Title EN: ${briefing.titleEn}`);
  console.log(`  Title PT: ${briefing.titlePt}`);
  console.log(`  Editorial EN: ${briefing.editorialEn.length} chars`);
  console.log(`  Editorial PT: ${briefing.editorialPt.length} chars`);
  console.log(`  Tags: ${briefing.tags.join(", ")}`);
  console.log("SUCCESS: Daily trend briefing generated and saved");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
