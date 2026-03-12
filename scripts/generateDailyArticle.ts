import { promises as fs } from "node:fs";
import path from "node:path";

import OpenAI from "openai";

import { getNewsReferences, getProjects } from "@/lib/content";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  const client = new OpenAI();
  const [projects, news] = await Promise.all([getProjects(), getNewsReferences()]);

  const prompt = `
You are generating a bilingual article draft for a senior data engineering portfolio platform.

Use the following project references:
${projects
  .map(
    (project) =>
      `- ${project.slug}: ${project.locales.en.title} | ${project.locales.en.summary}`,
  )
  .join("\n")}

Use the following news references:
${news
  .map(
    (item) =>
      `- ${item.slug}: ${item.locales.en.title} | source=${item.sourceName} | why=${item.locales.en.whyItMatters}`,
  )
  .join("\n")}

Return valid JSON with this shape:
{
  "titleEn": "",
  "titlePt": "",
  "excerptEn": "",
  "excerptPt": "",
  "categoryEn": "",
  "categoryPt": "",
  "tags": ["", ""],
  "readingMinutes": 6,
  "relatedProjectSlugs": ["project-slug"],
  "relatedNewsSlugs": ["news-slug"],
  "bodyEn": "Markdown body in English",
  "bodyPt": "Markdown body in Portuguese"
}

The article should connect a real market theme to one or more GitHub projects.
`;

  const response = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.7,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You write precise bilingual content for a data engineering portfolio site. Avoid hype. Keep it useful for recruiters and engineering managers.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error("Empty response from OpenAI.");
  }

  const payload = JSON.parse(content) as {
    titleEn: string;
    titlePt: string;
    excerptEn: string;
    excerptPt: string;
    categoryEn: string;
    categoryPt: string;
    tags: string[];
    readingMinutes: number;
    relatedProjectSlugs: string[];
    relatedNewsSlugs: string[];
    bodyEn: string;
    bodyPt: string;
  };

  const slug = slugify(payload.titleEn);
  const article = {
    slug,
    publishedAt: new Date().toISOString().slice(0, 10),
    featured: false,
    category: {
      en: payload.categoryEn,
      pt: payload.categoryPt,
    },
    tags: payload.tags.slice(0, 5),
    readingMinutes: payload.readingMinutes,
    relatedProjectSlugs: payload.relatedProjectSlugs,
    relatedNewsSlugs: payload.relatedNewsSlugs,
    locales: {
      en: {
        title: payload.titleEn,
        excerpt: payload.excerptEn,
        body: payload.bodyEn,
      },
      pt: {
        title: payload.titlePt,
        excerpt: payload.excerptPt,
        body: payload.bodyPt,
      },
    },
  };

  const target = path.join(process.cwd(), "content", "articles", `${slug}.json`);
  await fs.writeFile(target, `${JSON.stringify(article, null, 2)}\n`, "utf8");
  console.log(`Created ${target}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
