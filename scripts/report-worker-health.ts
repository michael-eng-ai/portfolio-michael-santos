import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { ensureBotTables, getBotState, setBotState } from "@/lib/bot-state";
import { queryPostgres } from "@/lib/postgres";
import { toErrorMessage } from "@/lib/runtime";
import { recordWorkerRun, updateWorkerRun } from "@/lib/worker-observability";

const execFileAsync = promisify(execFile);

const UNITS = [
  "michael-news-cycle.service",
  "michael-daily-briefing.service",
  "michael-engagement-cycle.service",
  "michael-health-check.service",
  "michael-dashboard.service",
];

type UnitStatus = {
  unit: string;
  activeState: string;
  subState: string;
  result: string;
  lastError: string | null;
};

type RecentRun = {
  task: string;
  step: string | null;
  status: string;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  error: string | null;
};

type AlertState = {
  signature?: string;
  status?: string;
  sentAt?: string;
};

function parseSystemctlShow(output: string) {
  return Object.fromEntries(
    output
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [key, ...rest] = line.split("=");
        return [key, rest.join("=")];
      }),
  );
}

async function getLastError(unit: string) {
  try {
    const { stdout } = await execFileAsync("journalctl", [
      "-u",
      unit,
      "--since",
      "24 hours ago",
      "--no-pager",
      "-n",
      "80",
    ]);

    const line = stdout
      .split("\n")
      .reverse()
      .find((entry) => /error|failed|failure|unregistered|too low|timeout/i.test(entry));

    return line?.replace(/\s+/g, " ").trim() ?? null;
  } catch (error) {
    return `journalctl unavailable: ${toErrorMessage(error)}`;
  }
}

async function getUnitStatus(unit: string): Promise<UnitStatus> {
  try {
    const { stdout } = await execFileAsync("systemctl", [
      "show",
      unit,
      "--property=ActiveState,SubState,Result",
      "--no-pager",
    ]);
    const fields = parseSystemctlShow(stdout);
    const activeState = fields.ActiveState ?? "unknown";
    const result = fields.Result ?? "unknown";
    const unhealthy = activeState === "failed" || result === "exit-code" || result === "timeout";

    return {
      unit,
      activeState,
      subState: fields.SubState ?? "unknown",
      result,
      lastError: unhealthy ? await getLastError(unit) : null,
    };
  } catch (error) {
    return {
      unit,
      activeState: "unknown",
      subState: "unknown",
      result: "unknown",
      lastError: toErrorMessage(error),
    };
  }
}

async function getRecentRuns() {
  await ensureBotTables();
  const { rows } = await queryPostgres<RecentRun>(
    `
      select task, step, status, started_at, finished_at, duration_ms, error
      from public.worker_runs
      order by started_at desc
      limit 20
    `,
  );

  return rows;
}

function getAlertSignature(units: UnitStatus[], recentRuns: RecentRun[]) {
  const unitFailures = units
    .filter((unit) => unit.activeState === "failed" || unit.result === "exit-code" || unit.result === "timeout")
    .map((unit) => `${unit.unit}:${unit.result}:${unit.lastError ?? "no-error"}`);
  const runFailures = recentRuns
    .filter((run) => run.status === "failed")
    .slice(0, 5)
    .map((run) => `${run.task}:${run.step ?? "task"}:${run.error ?? "no-error"}`);

  return [...unitFailures, ...runFailures].join("|");
}

function shouldSendAlert(previous: AlertState | null, status: string, signature: string) {
  if (status === "success") {
    return previous?.status && previous.status !== "success";
  }

  if (!previous?.sentAt || previous.signature !== signature || previous.status !== status) {
    return true;
  }

  const lastSentAt = new Date(previous.sentAt).getTime();
  return Number.isFinite(lastSentAt) && Date.now() - lastSentAt > 60 * 60 * 1000;
}

async function sendTelegramAlert(message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN_HERMES;
  const chatId = process.env.TELEGRAM_HOME_CHAT_ID;

  if (!token || !chatId) {
    return false;
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Telegram alert failed with status ${response.status}: ${await response.text()}`);
  }

  return true;
}

async function maybeSendAlert(status: string, units: UnitStatus[], recentRuns: RecentRun[]) {
  const signature = getAlertSignature(units, recentRuns);
  const previous = await getBotState<AlertState>("worker_health.last_alert");

  if (!shouldSendAlert(previous, status, signature)) {
    return;
  }

  const failedUnits = units.filter((unit) => unit.activeState === "failed" || unit.result !== "success");
  const failedRuns = recentRuns.filter((run) => run.status === "failed").slice(0, 5);
  const lines = [
    status === "success" ? "Hermes worker recovered." : "Hermes worker needs attention.",
    `status=${status}`,
    ...failedUnits.slice(0, 5).map((unit) => `unit=${unit.unit} active=${unit.activeState} result=${unit.result}`),
    ...failedRuns.map((run) => `run=${run.task}${run.step ? `/${run.step}` : ""} error=${run.error ?? "unknown"}`),
  ];

  try {
    const sent = await sendTelegramAlert(lines.join("\n"));
    await setBotState("worker_health.last_alert", {
      signature,
      status,
      sentAt: new Date().toISOString(),
      channel: sent ? "telegram" : "none",
    });
  } catch (error) {
    console.warn(`[health] failed to send alert: ${toErrorMessage(error)}`);
  }
}

async function main() {
  const runId = await recordWorkerRun({ task: "worker-health-report", status: "running" });

  try {
    const [units, recentRuns] = await Promise.all([
      Promise.all(UNITS.map(getUnitStatus)),
      getRecentRuns(),
    ]);

    const unhealthyUnits = units.filter((unit) =>
      unit.activeState === "failed" || unit.result === "exit-code" || unit.result === "timeout",
    );
    const failedRuns = recentRuns.filter((run) => run.status === "failed");
    const status = unhealthyUnits.length > 0 || failedRuns.length > 0 ? "warning" : "success";

    console.log(JSON.stringify({ checkedAt: new Date().toISOString(), status, units, recentRuns }, null, 2));
    await maybeSendAlert(status, units, recentRuns);

    await updateWorkerRun(runId, {
      status,
      metadata: {
        unhealthyUnits: unhealthyUnits.length,
        failedRuns: failedRuns.length,
      },
    });
  } catch (error) {
    await updateWorkerRun(runId, { status: "failed", error });
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
