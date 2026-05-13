import { ensureBotTables } from "@/lib/bot-state";
import { queryPostgres } from "@/lib/postgres";
import { toErrorMessage } from "@/lib/runtime";

type WorkerRunStatus = "running" | "success" | "failed" | "warning" | "skipped";

type WorkerRunInput = {
  task: string;
  step?: string;
  status: WorkerRunStatus;
  metadata?: Record<string, unknown>;
};

export async function recordWorkerRun(input: WorkerRunInput): Promise<number | null> {
  try {
    await ensureBotTables();
    const { rows } = await queryPostgres<{ id: number }>(
      `
        insert into public.worker_runs (task, step, status, metadata)
        values ($1, $2, $3, $4::jsonb)
        returning id
      `,
      [input.task, input.step ?? null, input.status, JSON.stringify(input.metadata ?? {})],
    );

    return rows[0]?.id ?? null;
  } catch (error) {
    console.warn(`[observability] failed to record worker run: ${toErrorMessage(error)}`);
    return null;
  }
}

export async function updateWorkerRun(
  id: number | null,
  input: { status: WorkerRunStatus; error?: unknown; metadata?: Record<string, unknown> },
) {
  if (!id) {
    return;
  }

  try {
    await queryPostgres(
      `
        update public.worker_runs
        set status = $2,
            finished_at = now(),
            duration_ms = greatest(0, floor(extract(epoch from (now() - started_at)) * 1000)::integer),
            error = $3,
            metadata = metadata || $4::jsonb
        where id = $1
      `,
      [
        id,
        input.status,
        input.error ? toErrorMessage(input.error) : null,
        JSON.stringify(input.metadata ?? {}),
      ],
    );
  } catch (error) {
    console.warn(`[observability] failed to update worker run ${id}: ${toErrorMessage(error)}`);
  }
}

export async function recordWorkerWarning(task: string, error: unknown, metadata?: Record<string, unknown>) {
  const id = await recordWorkerRun({
    task,
    status: "warning",
    metadata: {
      ...metadata,
      error: toErrorMessage(error),
    },
  });
  await updateWorkerRun(id, { status: "warning", error, metadata });
}
