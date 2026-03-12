import { promises as fs } from "node:fs";
import path from "node:path";

import { getProjects } from "@/lib/content";
import { fetchGithubRepoMetadata } from "@/lib/github";

async function main() {
  const projects = await getProjects();
  const repos = [];

  for (const project of projects) {
    const metadata = await fetchGithubRepoMetadata(project);
    repos.push(metadata);
    console.log(`Synced ${metadata.owner}/${metadata.repo}`);
  }

  const payload = {
    syncedAt: new Date().toISOString(),
    repos,
  };

  const outputPath = path.join(process.cwd(), "content", "generated", "github-repos.json");
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Updated ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
