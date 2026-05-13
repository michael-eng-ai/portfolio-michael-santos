import { spawn } from "node:child_process";

import { getRequiredWriteDatabaseEnvKeys } from "@/lib/database";
import { recordWorkerRun, recordWorkerWarning, updateWorkerRun } from "@/lib/worker-observability";

type WorkerTask = "news-cycle" | "daily-cycle" | "engagement-cycle";

type Step = {
  label: string;
  script: string;
  requiredEnv: string[];
  optional?: boolean;
};

const tasks: Record<WorkerTask, Step[]> = {
  "news-cycle": [
    {
      label: "Sync RSS news",
      script: "content:sync:news",
      requiredEnv: ["__WRITE_DATABASE__"],
    },
    {
      label: "Enrich news with LLM",
      script: "content:enrich:news",
      requiredEnv: ["__WRITE_DATABASE__", "__LLM__"],
      optional: true,
    },
    {
      label: "Curate top news for today",
      script: "content:curate:news",
      requiredEnv: ["__WRITE_DATABASE__", "__LLM__"],
      optional: true,
    },
    {
      label: "Cleanup old news items",
      script: "content:cleanup:news",
      requiredEnv: ["__WRITE_DATABASE__"],
      optional: true,
    },
    {
      label: "Post news to X",
      script: "content:post:x",
      requiredEnv: [
        "__WRITE_DATABASE__",
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
      requiredEnv: ["__WRITE_DATABASE__", "__LLM__"],
      optional: true,
    },
    {
      label: "Post latest news to LinkedIn",
      script: "content:post:linkedin",
      requiredEnv: [
        "__WRITE_DATABASE__",
        "LINKEDIN_ACCESS_TOKEN",
      ],
      optional: true,
    },
  ],
  "engagement-cycle": [
    {
      label: "Reply to X mentions",
      script: "content:reply:x",
      requiredEnv: [
        "X_API_KEY",
        "X_API_SECRET",
        "X_ACCESS_TOKEN",
        "X_ACCESS_TOKEN_SECRET",
        "__LLM__",
      ],
      optional: true,
    },
    {
      label: "Reply to LinkedIn comments",
      script: "content:reply:linkedin",
      requiredEnv: [
        "__WRITE_DATABASE__",
        "LINKEDIN_ACCESS_TOKEN",
        "__LLM__",
      ],
      optional: true,
    },
  ],
};

function getMissingEnv(requiredEnv: string[]) {
  return requiredEnv.flatMap((key) => {
    if (key === "__LLM__") {
      return process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY ? [] : ["GEMINI_API_KEY or GROQ_API_KEY"];
    }

    return key.split(",").map((entry) => entry.trim()).filter((entry) => entry.length > 0 && !process.env[entry]);
  });
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
    console.error("Usage: pnpm content:worker:news-cycle | pnpm content:worker:daily-cycle | pnpm content:worker:engagement-cycle");
    process.exit(1);
  }

  const sharedDatabaseEnv = getRequiredWriteDatabaseEnvKeys();
  const pipeline = tasks[taskName];
  const taskRunId = await recordWorkerRun({ task: taskName, status: "running" });

  try {
    for (const step of pipeline) {
      step.requiredEnv = step.requiredEnv.map((entry) =>
        entry === "__WRITE_DATABASE__" ? sharedDatabaseEnv.join(",") : entry,
      );
    }

    for (const step of pipeline) {
      const missing = getMissingEnv(step.requiredEnv);

      if (missing.length > 0) {
        if (step.optional) {
          console.log(`[worker] skipping "${step.label}" because env vars are missing: ${missing.join(", ")}`);
          continue;
        }

        console.error(`[worker] cannot run "${step.label}". Missing env vars: ${missing.join(", ")}`);
        await updateWorkerRun(taskRunId, {
          status: "failed",
          error: new Error(`Missing env vars for ${step.label}: ${missing.join(", ")}`),
        });
        process.exit(1);
      }

      console.log(`[worker] starting "${step.label}"`);
      const stepRunId = await recordWorkerRun({ task: taskName, step: step.label, status: "running" });

      try {
        await runPnpmScript(step.script);
        await updateWorkerRun(stepRunId, { status: "success" });
        console.log(`[worker] finished "${step.label}"`);
      } catch (error) {
        await updateWorkerRun(stepRunId, { status: "failed", error });
        if (step.optional) {
          await recordWorkerWarning(
            taskName,
            `Optional step "${step.label}" failed: ${error instanceof Error ? error.message : String(error)}`,
          );
          console.warn(`[worker] optional step "${step.label}" failed; continuing task`);
          continue;
        }
        throw error;
      }
    }

    await updateWorkerRun(taskRunId, { status: "success" });
    console.log(`[worker] task "${taskName}" completed`);
  } catch (error) {
    await updateWorkerRun(taskRunId, { status: "failed", error });
    throw error;
  }
}

main().catch((error) => {
  console.error("[worker] task failed", error);
  process.exit(1);
});
