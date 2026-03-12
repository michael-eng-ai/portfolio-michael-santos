import { spawn } from "node:child_process";

function readArg(flag: string) {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return null;
  }

  return process.argv[index + 1] ?? null;
}

function timestamp() {
  return new Date().toISOString().replace(/[:T]/g, "-").slice(0, 16);
}

async function runCommand(command: string, args: string[], options: { allowFailure?: boolean } = {}) {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      stdio: "inherit",
      env: process.env,
    });

    child.on("exit", (code) => {
      if (code === 0 || options.allowFailure) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} failed with code ${code ?? "unknown"}`));
    });

    child.on("error", reject);
  });
}

async function captureCommand(command: string, args: string[]) {
  return await new Promise<string>((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    const child = spawn(command, args, {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    });

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve(stdout.trim());
        return;
      }

      reject(new Error(stderr.trim() || `${command} failed with code ${code ?? "unknown"}`));
    });

    child.on("error", reject);
  });
}

async function main() {
  const baseBranch = process.env.LOCAL_CONTENT_BASE_BRANCH ?? "main";
  const topicHint = readArg("--topic") ?? process.env.CLAUDE_CONTENT_TOPIC_HINT ?? null;
  const runBuild = (process.env.LOCAL_CONTENT_RUN_BUILD ?? "true") === "true";
  const autoPush = (process.env.LOCAL_CONTENT_PUSH ?? "false") === "true";
  const autoOpenPr = (process.env.LOCAL_CONTENT_OPEN_PR ?? "false") === "true";

  if (autoOpenPr && !autoPush) {
    throw new Error("LOCAL_CONTENT_OPEN_PR=true requires LOCAL_CONTENT_PUSH=true.");
  }

  const status = await captureCommand("git", ["status", "--porcelain"]);

  if (status) {
    throw new Error("Working tree is not clean. Commit or stash your changes before running the local content automation.");
  }

  const currentBranch = await captureCommand("git", ["rev-parse", "--abbrev-ref", "HEAD"]);

  if (currentBranch !== baseBranch) {
    throw new Error(`Current branch is ${currentBranch}. Switch to ${baseBranch} before running the local content automation.`);
  }

  await runCommand("git", ["pull", "--ff-only", "origin", baseBranch]);

  const branchName = `codex/local-content-${timestamp()}`;
  await runCommand("git", ["checkout", "-b", branchName]);

  try {
    const generationArgs = ["content:generate:article:claude"];

    if (topicHint) {
      generationArgs.push("--", "--topic", topicHint);
    }

    await runCommand("pnpm", generationArgs);
    await runCommand("pnpm", ["content:linkedin"]);
    await runCommand("pnpm", ["content:x"]);
    await runCommand("pnpm", ["content:validate"]);
    await runCommand("pnpm", ["check"]);

    if (runBuild) {
      await runCommand("pnpm", ["build"]);
    }

    const changedFiles = await captureCommand("git", ["status", "--porcelain"]);

    if (!changedFiles) {
      console.log("No content changes were generated. Cleaning up branch.");
      await runCommand("git", ["checkout", baseBranch]);
      await runCommand("git", ["branch", "-D", branchName]);
      return;
    }

    await runCommand("git", ["add", "content/articles", "content/linkedin", "content/x"]);
    await runCommand("git", ["commit", "-m", "chore: generate article and social drafts"]);

    if (autoPush) {
      await runCommand("git", ["push", "-u", "origin", branchName]);
    }

    if (autoOpenPr) {
      await runCommand("gh", [
        "pr",
        "create",
        "--base",
        baseBranch,
        "--head",
        branchName,
        "--title",
        "chore: generate article and social drafts",
        "--body",
        "Automated local Claude content generation with validated social drafts.",
      ]);
    }

    console.log(`Automation completed on branch ${branchName}.`);
  } catch (error) {
    console.error("Local content automation failed.");
    throw error;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
