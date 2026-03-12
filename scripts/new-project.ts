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
  const repo = readArg("--repo");

  if (!slug || !repo) {
    throw new Error("Usage: pnpm content:new:project --slug my-project --repo owner/repo");
  }

  const [owner, repoName] = repo.split("/");

  if (!owner || !repoName) {
    throw new Error("Repository must follow owner/repo format.");
  }

  const target = path.join(process.cwd(), "content", "projects", `${slug}.json`);

  const payload = {
    slug,
    featured: false,
    order: 999,
    stack: ["Python", "SQL"],
    tags: ["new-project"],
    github: {
      owner,
      repo: repoName,
      url: `https://github.com/${owner}/${repoName}`,
    },
    channelStrategy: {
      site: {
        primaryAngle: "Business problem and executive-facing case narrative",
        audience: "Recruiters, managers, business and product stakeholders",
        businessMessage: "Explain why this project matters to the business and what changes operationally."
      },
      github: {
        primaryAngle: "Operational implementation and technical proof",
        audience: "Engineers, technical reviewers, hiring teams",
        operationalMessage: "Show architecture, setup, code structure, and implementation details."
      },
      linkedin: {
        primaryAngle: "Bridge between business impact and technical credibility",
        audience: "Professional network, recruiters, data leaders",
        bridgeMessage: "Summarize the business problem, the delivery pattern, and the implementation signal."
      }
    },
    relatedArticleSlugs: [],
    relatedNewsSlugs: [],
    locales: {
      en: {
        title: "Project title",
        subtitle: "Project subtitle",
        summary: "Short public summary for the card and metadata.",
        businessProblem: "Describe the real business problem behind the project.",
        technicalSolution: ["Explain the implementation path", "List the main technical decisions"],
        architectureSummary: "Summarize the architecture in one paragraph.",
        impact: ["Explain why the project matters", "Describe expected or delivered value"],
        body: "## Context\n\nAdd the project narrative in markdown."
      },
      pt: {
        title: "Titulo do projeto",
        subtitle: "Subtitulo do projeto",
        summary: "Resumo curto para card e metadata.",
        businessProblem: "Descreva o problema real de negocio por tras do projeto.",
        technicalSolution: ["Explique o caminho de implementacao", "Liste as principais decisoes tecnicas"],
        architectureSummary: "Resuma a arquitetura em um paragrafo.",
        impact: ["Explique por que o projeto importa", "Descreva o valor esperado ou entregue"],
        body: "## Contexto\n\nAdicione a narrativa do projeto em markdown."
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
