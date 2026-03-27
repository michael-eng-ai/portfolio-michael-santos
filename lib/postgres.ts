import { Pool, type QueryResult, type QueryResultRow } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __michaelBusinessPostgresPool: Pool | undefined;
}

function getSslConfig() {
  const sslMode = process.env.DATABASE_SSL?.toLowerCase();

  if (sslMode === "true" || sslMode === "require") {
    return { rejectUnauthorized: false };
  }

  return undefined;
}

export function getPostgresConnectionString() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return connectionString;
}

export function getPostgresPool() {
  if (!globalThis.__michaelBusinessPostgresPool) {
    globalThis.__michaelBusinessPostgresPool = new Pool({
      connectionString: getPostgresConnectionString(),
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      allowExitOnIdle: true,
      ssl: getSslConfig(),
    });
  }

  return globalThis.__michaelBusinessPostgresPool;
}

export async function queryPostgres<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values: unknown[] = [],
): Promise<QueryResult<T>> {
  return getPostgresPool().query<T>(text, values);
}

export async function closePostgresPool() {
  if (!globalThis.__michaelBusinessPostgresPool) {
    return;
  }

  await globalThis.__michaelBusinessPostgresPool.end();
  globalThis.__michaelBusinessPostgresPool = undefined;
}
