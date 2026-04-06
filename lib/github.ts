import { Project } from "@/lib/content";

export type RepoSyncResult = {
  owner: string;
  repo: string;
  description: string | null;
  homepage: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  topics: string[];
  defaultBranch: string;
  pushedAt: string | null;
  updatedAt: string | null;
};

export async function fetchGithubRepoMetadata(project: Project): Promise<RepoSyncResult> {
  const token = process.env.GITHUB_TOKEN;

  const response = await fetch(
    `https://api.github.com/repos/${project.github.owner}/${project.github.repo}`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      next: { revalidate: 3600 },
    },
  );

  if (!response.ok) {
    if (response.status === 404) {
      console.warn(`SKIPPED: repo ${project.github.owner}/${project.github.repo} not found (404)`);
      return {
        owner: project.github.owner,
        repo: project.github.repo,
        description: null,
        homepage: null,
        stars: 0,
        forks: 0,
        openIssues: 0,
        topics: [],
        defaultBranch: "main",
        pushedAt: null,
        updatedAt: null,
      };
    }
    throw new Error(
      `GitHub repo sync failed for ${project.github.owner}/${project.github.repo}: ${response.status}`,
    );
  }

  const data = (await response.json()) as {
    description: string | null;
    homepage: string | null;
    stargazers_count: number;
    forks_count: number;
    open_issues_count: number;
    topics: string[];
    default_branch: string;
    pushed_at: string | null;
    updated_at: string | null;
  };

  return {
    owner: project.github.owner,
    repo: project.github.repo,
    description: data.description,
    homepage: data.homepage,
    stars: data.stargazers_count,
    forks: data.forks_count,
    openIssues: data.open_issues_count,
    topics: data.topics ?? [],
    defaultBranch: data.default_branch,
    pushedAt: data.pushed_at,
    updatedAt: data.updated_at,
  };
}
