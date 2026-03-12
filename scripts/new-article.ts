import { promises as fs } from "node:fs";
import path from "node:path";

function readArg(flag: string) {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return null;
  }

  return process.argv[index + 1] ?? null;
}

async function main() {
  const slug = readArg("--slug");

  if (!slug) {
    throw new Error("Usage: pnpm content:new:article --slug my-article");
  }

  const target = path.join(process.cwd(), "content", "articles", `${slug}.json`);

  const payload = {
    slug,
    publishedAt: new Date().toISOString().slice(0, 10),
    featured: false,
    category: {
      en: "Article category",
      pt: "Categoria do artigo"
    },
    tags: ["draft"],
    readingMinutes: 6,
    channelStrategy: {
      site: {
        primaryAngle: "Business-facing analysis with market context",
        audience: "Executives, managers, recruiters, clients",
        businessMessage: "Explain why the topic matters and which business pressure it addresses."
      },
      github: {
        primaryAngle: "Reference back to technical implementation only when useful",
        audience: "Engineers and technical readers",
        operationalMessage: "Link the article to a repository that proves the operational pattern."
      },
      linkedin: {
        primaryAngle: "Short synthesis for public distribution",
        audience: "Broader professional audience",
        bridgeMessage: "Turn the article into a concise bridge between market pressure and execution."
      }
    },
    relatedProjectSlugs: [],
    relatedNewsSlugs: [],
    locales: {
      en: {
        title: "English article title",
        excerpt: "Short English excerpt.",
        body: "## Main idea\n\nWrite the English markdown body."
      },
      pt: {
        title: "Titulo do artigo em portugues",
        excerpt: "Resumo curto em portugues.",
        body: "## Ideia principal\n\nEscreva o corpo em markdown em portugues."
      }
    }
  };

  await fs.writeFile(target, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Created ${target}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
