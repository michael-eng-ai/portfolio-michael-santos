import { queryPostgres } from "@/lib/postgres";

export async function ensureBotTables() {
  await queryPostgres(`
    create table if not exists public.bot_state (
      key text primary key,
      value jsonb not null,
      updated_at timestamptz not null default now()
    )
  `);

  await queryPostgres(`
    create table if not exists public.worker_runs (
      id bigserial primary key,
      task text not null,
      step text,
      status text not null check (status in ('running', 'success', 'failed', 'warning', 'skipped')),
      started_at timestamptz not null default now(),
      finished_at timestamptz,
      duration_ms integer,
      error text,
      metadata jsonb not null default '{}'::jsonb
    )
  `);

  await queryPostgres(`
    create index if not exists worker_runs_task_started_idx
      on public.worker_runs (task, started_at desc)
  `);

  await queryPostgres(`
    create index if not exists worker_runs_status_started_idx
      on public.worker_runs (status, started_at desc)
  `);
}

export async function getBotState<T>(key: string): Promise<T | null> {
  await ensureBotTables();
  const { rows } = await queryPostgres<{ value: T }>(
    "select value from public.bot_state where key = $1 limit 1",
    [key],
  );

  return rows[0]?.value ?? null;
}

export async function setBotState(key: string, value: unknown) {
  await ensureBotTables();
  await queryPostgres(
    `
      insert into public.bot_state (key, value, updated_at)
      values ($1, $2::jsonb, now())
      on conflict (key) do update
      set value = excluded.value,
          updated_at = now()
    `,
    [key, JSON.stringify(value)],
  );
}
