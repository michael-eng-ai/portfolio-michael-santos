import { readFile } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";

import { closePostgresPool, getPostgresPool } from "@/lib/postgres";

type NewsRow = Record<string, unknown>;
type NewsletterSubscriberRow = Record<string, unknown>;

const NEWS_COLUMNS = [
  "slug",
  "published_at",
  "source_name",
  "source_url",
  "image_url",
  "category",
  "tags",
  "related_project_slugs",
  "locales",
  "editorial_analysis",
  "is_active",
  "posted_to_x_at",
  "posted_to_linkedin_at",
  "x_post_status",
  "x_attempt_count",
  "x_last_attempt_at",
  "x_next_retry_at",
  "x_last_error",
  "x_external_post_id",
  "linkedin_post_status",
  "linkedin_attempt_count",
  "linkedin_last_attempt_at",
  "linkedin_next_retry_at",
  "linkedin_last_error",
  "linkedin_external_post_id",
  "created_at",
  "updated_at",
] as const;

const NEWSLETTER_COLUMNS = [
  "email",
  "locale",
  "source",
  "consented_at",
  "created_at",
] as const;

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function fetchAllRows<T extends Record<string, unknown>>(
  table: "news" | "newsletter_subscribers",
  orderColumn: string,
  options?: { optional?: boolean },
) {
  const supabase = getSupabaseAdminClient();
  const pageSize = 1_000;
  const rows: T[] = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order(orderColumn, { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      if (options?.optional && error.message.includes("schema cache")) {
        console.warn(`Skipping optional Supabase table ${table}: ${error.message}`);
        return [];
      }

      throw new Error(`Failed to fetch ${table} from Supabase: ${error.message}`);
    }

    const chunk = (data ?? []) as T[];
    rows.push(...chunk);

    if (chunk.length < pageSize) {
      break;
    }
  }

  return rows;
}

function normalizeNewsRow(row: NewsRow) {
  const postedToXAt = typeof row.posted_to_x_at === "string" ? row.posted_to_x_at : null;
  const postedToLinkedinAt = typeof row.posted_to_linkedin_at === "string" ? row.posted_to_linkedin_at : null;

  return {
    slug: row.slug,
    published_at: row.published_at,
    source_name: row.source_name,
    source_url: row.source_url,
    image_url: row.image_url ?? null,
    category: row.category ?? null,
    tags: Array.isArray(row.tags) ? row.tags : [],
    related_project_slugs: Array.isArray(row.related_project_slugs) ? row.related_project_slugs : [],
    locales: row.locales,
    editorial_analysis: row.editorial_analysis ?? null,
    is_active: typeof row.is_active === "boolean" ? row.is_active : true,
    posted_to_x_at: postedToXAt,
    posted_to_linkedin_at: postedToLinkedinAt,
    x_post_status:
      typeof row.x_post_status === "string"
        ? row.x_post_status
        : postedToXAt
          ? "posted"
          : "pending",
    x_attempt_count: Number.isFinite(row.x_attempt_count) ? Number(row.x_attempt_count) : 0,
    x_last_attempt_at: typeof row.x_last_attempt_at === "string" ? row.x_last_attempt_at : null,
    x_next_retry_at: typeof row.x_next_retry_at === "string" ? row.x_next_retry_at : null,
    x_last_error: typeof row.x_last_error === "string" ? row.x_last_error : null,
    x_external_post_id: typeof row.x_external_post_id === "string" ? row.x_external_post_id : null,
    linkedin_post_status:
      typeof row.linkedin_post_status === "string"
        ? row.linkedin_post_status
        : postedToLinkedinAt
          ? "posted"
          : "pending",
    linkedin_attempt_count: Number.isFinite(row.linkedin_attempt_count) ? Number(row.linkedin_attempt_count) : 0,
    linkedin_last_attempt_at:
      typeof row.linkedin_last_attempt_at === "string" ? row.linkedin_last_attempt_at : null,
    linkedin_next_retry_at:
      typeof row.linkedin_next_retry_at === "string" ? row.linkedin_next_retry_at : null,
    linkedin_last_error: typeof row.linkedin_last_error === "string" ? row.linkedin_last_error : null,
    linkedin_external_post_id:
      typeof row.linkedin_external_post_id === "string" ? row.linkedin_external_post_id : null,
    created_at: typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
    updated_at:
      typeof row.updated_at === "string"
        ? row.updated_at
        : typeof row.created_at === "string"
          ? row.created_at
          : new Date().toISOString(),
  };
}

function normalizeNewsletterSubscriberRow(row: NewsletterSubscriberRow) {
  return {
    email: row.email,
    locale: row.locale,
    source: row.source,
    consented_at: row.consented_at,
    created_at: typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
  };
}

function buildBulkUpsertQuery(
  table: string,
  columns: readonly string[],
  rows: Record<string, unknown>[],
  conflictColumns: readonly string[],
  updateColumns: readonly string[],
) {
  const values: unknown[] = [];
  const tuples = rows.map((row, rowIndex) => {
    const placeholders = columns.map((column, columnIndex) => {
      values.push(row[column] ?? null);
      return `$${rowIndex * columns.length + columnIndex + 1}`;
    });

    return `(${placeholders.join(", ")})`;
  });

  const updateAssignments = updateColumns.map((column) => `${column} = excluded.${column}`);

  return {
    text: `
      insert into public.${table} (${columns.join(", ")})
      values ${tuples.join(", ")}
      on conflict (${conflictColumns.join(", ")}) do update
      set ${updateAssignments.join(", ")}
    `,
    values,
  };
}

async function ensurePostgresSchema() {
  const pool = getPostgresPool();
  const newsSql = await readFile(path.join(process.cwd(), "supabase", "news.sql"), "utf8");
  const newsletterSql = await readFile(path.join(process.cwd(), "supabase", "newsletter_subscribers.sql"), "utf8");

  await pool.query(newsSql);
  await pool.query(newsletterSql);
}

async function main() {
  const pool = getPostgresPool();

  try {
    await ensurePostgresSchema();

    const [newsRows, newsletterRows] = await Promise.all([
      fetchAllRows<NewsRow>("news", "id"),
      fetchAllRows<NewsletterSubscriberRow>("newsletter_subscribers", "id", { optional: true }),
    ]);

    const normalizedNews = newsRows.map(normalizeNewsRow);
    const normalizedNewsletter = newsletterRows.map(normalizeNewsletterSubscriberRow);

    const client = await pool.connect();

    try {
      await client.query("begin");

      if (normalizedNews.length > 0) {
        const query = buildBulkUpsertQuery(
          "news",
          NEWS_COLUMNS,
          normalizedNews,
          ["source_url"],
          NEWS_COLUMNS.filter((column) => column !== "created_at"),
        );
        await client.query(query.text, query.values);
      }

      if (normalizedNewsletter.length > 0) {
        const query = buildBulkUpsertQuery(
          "newsletter_subscribers",
          NEWSLETTER_COLUMNS,
          normalizedNewsletter,
          ["email"],
          NEWSLETTER_COLUMNS.filter((column) => column !== "created_at"),
        );
        await client.query(query.text, query.values);
      }

      await client.query("commit");
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }

    console.log(
      `Shadow sync complete: ${normalizedNews.length} news rows and ${normalizedNewsletter.length} newsletter subscribers copied to PostgreSQL`,
    );
  } finally {
    await closePostgresPool();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
