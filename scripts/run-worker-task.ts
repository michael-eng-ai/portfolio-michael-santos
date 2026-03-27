import { spawn } from "node:child_process";

type WorkerTask = "news-cycle" | "daily-cycle";

type Step = {
  label: string;
  script: string;
  requiredEnv: string[];
  optional?: boolean;
};

const sharedSupabaseEnv = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];

const tasks: Record<WorkerTask, Step[]> = {
  "news-cycle": [
    {
      label: "Sync RSS news",
      script: "content:sync:news",
      requiredEnv: sharedSupabaseEnv,
    },
    {
      label: "Enrich news with Claude",
      script: "content:enrich:news",
      requiredEnv: [...sharedSupabaseEnv, "ANTHROPIC_API_KEY"],
      optional: true,
    },
    {
      label: "Post news to X",
      script: "content:post:x",
      requiredEnv: [
        ...sharedSupabaseEnv,
        "X_API_KEY",
        "X_API_SECRET",
        "X_ACCESS_TOKEN",
        "X_ACCESS_TOKEN_SECRET",
      ],
      optional: true,
    },
  ],
  "daily-cycle": [
    {
      label: "Generate daily trend briefing",
      script: "content:daily:briefing",
      requiredEnv: [...sharedSupabaseEnv, "ANTHROPIC_API_KEY"],
      optional: true,
    },
    {
      label: "Post latest news to LinkedIn",
      script: "content:post:linkedin",
      requiredEnv: [
        ...sharedSupabaseEnv,
        "LINKEDIN_ACCESS_TOKEN",
        "LINKEDIN_PERSON_URN",
      ],
      optional: true,
    },
  ],
};

function getMissingEnv(requiredEnv: string[]) {
  return requiredEnv.filter((key) => !process.env[key]);
}

function runPnpmScript(script: string) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn("pnpm", [script], {
      cwd: process.cwd(),
      env: process.env,
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`pnpm ${script} exited with code ${code ?? "unknown"}`));
    });
  });
}

async function main() {
  const taskName = process.argv[2] as WorkerTask | undefined;

  if (!taskName || !(taskName in tasks)) {
    console.error("Usage: pnpm content:worker:news-cycle | pnpm content:worker:daily-cycle");
    process.exit(1);
  }

  const pipeline = tasks[taskName];

  for (const step of pipeline) {
    const missing = getMissingEnv(step.requiredEnv);

    if (missing.length > 0) {
      if (step.optional) {
        console.log(`[worker] skipping "${step.label}" because env vars are missing: ${missing.join(", ")}`);
        continue;
      }

      console.error(`[worker] cannot run "${step.label}". Missing env vars: ${missing.join(", ")}`);
      process.exit(1);
    }

    console.log(`[worker] starting "${step.label}"`);
    await runPnpmScript(step.script);
    console.log(`[worker] finished "${step.label}"`);
  }

  console.log(`[worker] task "${taskName}" completed`);
}

main().catch((error) => {
  console.error("[worker] task failed", error);
  process.exit(1);
});
