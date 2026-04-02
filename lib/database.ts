import type { DeliveryChannel } from "@/lib/news-delivery";
import { queryPostgres } from "@/lib/postgres";
import { getSupabaseAdminClient } from "@/lib/supabase";

export type DatabaseProvider = "supabase" | "postgres";

export type NewsRowRecord = Record<string, unknown> & {
  slug: string;
  published_at: string;
  source_name: string;
  source_url: string;
  image_url: string | null;
  category: Record<string, unknown> | null;
  tags: string[];
  related_project_slugs: string[];
  locales: Record<string, unknown>;
  editorial_analysis: Record<string, unknown> | null;
  is_active: boolean;
  posted_to_x_at: string | null;
  posted_to_linkedin_at: string | null;
  x_post_status: string | null;
  x_attempt_count: number | null;
  x_last_attempt_at: string | null;
  x_next_retry_at: string | null;
  x_last_error: string | null;
  x_external_post_id: string | null;
  linkedin_post_status: string | null;
  linkedin_attempt_count: number | null;
  linkedin_last_attempt_at: string | null;
  linkedin_next_retry_at: string | null;
  linkedin_last_error: string | null;
  linkedin_external_post_id: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type NewsletterSubscriberInsert = {
  email: string;
  locale: string;
  source: string;
  consented_at: string;
};

export type AnalyticsEventInsert = {
  event_id: string;
  event_name: string;
  session_id: string;
  occurred_at: string;
  page: string | null;
  locale: string | null;
  page_type: string | null;
  source_type: string | null;
  source_slug: string | null;
  target_type: string | null;
  target_slug: string | null;
  location: string | null;
  depth: number | null;
  metadata: Record<string, unknown>;
};

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

const LEGACY_SUPABASE_NEWS_COLUMNS = [
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
  "created_at",
  "updated_at",
] as const;

function requireString(value: unknown, field: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Missing required news field: ${field}`);
  }

  return value;
}

function requireObject(value: unknown, field: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Missing required news field: ${field}`);
  }

  return value as Record<string, unknown>;
}

function toStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function toOptionalString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function toOptionalNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toTimestampString(value: unknown, field: string) {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  throw new Error(`Missing required news field: ${field}`);
}

function toOptionalTimestampString(value: unknown) {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  return null;
}

function parseDatabaseProvider(raw: string | undefined): DatabaseProvider | null {
  const normalized = raw?.trim().toLowerCase();

  if (normalized === "supabase" || normalized === "postgres") {
    return normalized;
  }

  return null;
}

export function getDatabaseProvider(): DatabaseProvider {
  return parseDatabaseProvider(process.env.DATABASE_PROVIDER) ?? "supabase";
}

export function getSecondaryDatabaseProvider(): DatabaseProvider | null {
  const provider = parseDatabaseProvider(process.env.SECONDARY_DATABASE_PROVIDER);

  if (!provider || provider === getDatabaseProvider()) {
    return null;
  }

  return provider;
}

function getRequiredDatabaseEnvKeys(provider: DatabaseProvider) {
  return provider === "postgres" ? ["DATABASE_URL"] : ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
}

export function getRequiredPrimaryDatabaseEnvKeys() {
  return getRequiredDatabaseEnvKeys(getDatabaseProvider());
}

export function getRequiredWriteDatabaseEnvKeys() {
  return [...new Set([
    ...getRequiredPrimaryDatabaseEnvKeys(),
    ...(getSecondaryDatabaseProvider() ? getRequiredDatabaseEnvKeys(getSecondaryDatabaseProvider() as DatabaseProvider) : []),
  ])];
}

function normalizeNewsRow(row: Record<string, unknown>): NewsRowRecord {
  const postedToXAt = toOptionalTimestampString(row.posted_to_x_at);
  const postedToLinkedinAt = toOptionalTimestampString(row.posted_to_linkedin_at);
  const createdAt = toOptionalTimestampString(row.created_at) ?? new Date().toISOString();

  return {
    ...row,
    slug: requireString(row.slug, "slug"),
    published_at: toTimestampString(row.published_at, "published_at"),
    source_name: requireString(row.source_name, "source_name"),
    source_url: requireString(row.source_url, "source_url"),
    image_url: toOptionalString(row.image_url),
    category: row.category && typeof row.category === "object" && !Array.isArray(row.category)
      ? (row.category as Record<string, unknown>)
      : null,
    tags: toStringArray(row.tags),
    related_project_slugs: toStringArray(row.related_project_slugs),
    locales: requireObject(row.locales, "locales"),
    editorial_analysis:
      row.editorial_analysis && typeof row.editorial_analysis === "object" && !Array.isArray(row.editorial_analysis)
        ? (row.editorial_analysis as Record<string, unknown>)
        : null,
    is_active: typeof row.is_active === "boolean" ? row.is_active : true,
    posted_to_x_at: postedToXAt,
    posted_to_linkedin_at: postedToLinkedinAt,
    x_post_status:
      typeof row.x_post_status === "string" ? row.x_post_status : postedToXAt ? "posted" : "pending",
    x_attempt_count: toOptionalNumber(row.x_attempt_count) ?? 0,
    x_last_attempt_at: toOptionalTimestampString(row.x_last_attempt_at),
    x_next_retry_at: toOptionalTimestampString(row.x_next_retry_at),
    x_last_error: toOptionalString(row.x_last_error),
    x_external_post_id: toOptionalString(row.x_external_post_id),
    linkedin_post_status:
      typeof row.linkedin_post_status === "string"
        ? row.linkedin_post_status
        : postedToLinkedinAt
          ? "posted"
          : "pending",
    linkedin_attempt_count: toOptionalNumber(row.linkedin_attempt_count) ?? 0,
    linkedin_last_attempt_at: toOptionalTimestampString(row.linkedin_last_attempt_at),
    linkedin_next_retry_at: toOptionalTimestampString(row.linkedin_next_retry_at),
    linkedin_last_error: toOptionalString(row.linkedin_last_error),
    linkedin_external_post_id: toOptionalString(row.linkedin_external_post_id),
    created_at: createdAt,
    updated_at: toOptionalTimestampString(row.updated_at) ?? createdAt,
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

  return {
    text: `
      insert into public.${table} (${columns.join(", ")})
      values ${tuples.join(", ")}
      on conflict (${conflictColumns.join(", ")}) do update
      set ${updateColumns.map((column) => `${column} = excluded.${column}`).join(", ")}
      returning *
    `,
    values,
  };
}

function buildUpdateNewsBySlugQuery(slug: string, patch: Record<string, unknown>) {
  const entries = Object.entries(patch);

  if (entries.length === 0) {
    return null;
  }

  const values = entries.map(([, value]) => value);
  const assignments = entries.map(([column], index) => `${column} = $${index + 1}`);

  return {
    text: `
      update public.news
      set ${assignments.join(", ")}
      where slug = $${entries.length + 1}
    `,
    values: [...values, slug],
  };
}

function isSupabaseMissingColumnError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.message.includes("Could not find the '") && error.message.includes("' column of 'news'");
}

function stripUnsupportedSupabaseNewsRow(row: NewsRowRecord) {
  return Object.fromEntries(
    LEGACY_SUPABASE_NEWS_COLUMNS.map((column) => [column, row[column] ?? null]),
  ) as Record<string, unknown>;
}

function stripUnsupportedSupabaseNewsPatch(patch: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(patch).filter(([column]) =>
      (LEGACY_SUPABASE_NEWS_COLUMNS as readonly string[]).includes(column),
    ),
  );
}

async function listActiveNewsRowsFromSupabase() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("news")
    .select("*")
    .eq("is_active", true)
    .order("published_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => normalizeNewsRow(row as Record<string, unknown>));
}

async function listActiveNewsRowsFromPostgres() {
  const { rows } = await queryPostgres<NewsRowRecord>(
    "select * from public.news where is_active = true order by published_at desc",
  );
  return rows.map((row) => normalizeNewsRow(row));
}

export async function listActiveNewsRows() {
  return getDatabaseProvider() === "postgres"
    ? listActiveNewsRowsFromPostgres()
    : listActiveNewsRowsFromSupabase();
}

async function getActiveNewsRowBySlugFromSupabase(slug: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("news")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? normalizeNewsRow(data as Record<string, unknown>) : null;
}

async function getActiveNewsRowBySlugFromPostgres(slug: string) {
  const { rows } = await queryPostgres<NewsRowRecord>(
    "select * from public.news where slug = $1 and is_active = true limit 1",
    [slug],
  );
  return rows[0] ? normalizeNewsRow(rows[0]) : null;
}

export async function getActiveNewsRowBySlug(slug: string) {
  return getDatabaseProvider() === "postgres"
    ? getActiveNewsRowBySlugFromPostgres(slug)
    : getActiveNewsRowBySlugFromSupabase(slug);
}

export async function getActiveNewsSampleRow() {
  if (getDatabaseProvider() === "postgres") {
    const { rows } = await queryPostgres<NewsRowRecord>(
      "select * from public.news where is_active = true limit 1",
    );
    return rows[0] ? normalizeNewsRow(rows[0]) : null;
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("news")
    .select("*")
    .eq("is_active", true)
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  const row = (data ?? [])[0];
  return row ? normalizeNewsRow(row as Record<string, unknown>) : null;
}

export async function getActiveNewsPresence() {
  if (getDatabaseProvider() === "postgres") {
    const { rows } = await queryPostgres<{ slug: string }>(
      "select slug from public.news where is_active = true limit 1",
    );
    return rows.length;
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("news")
    .select("slug")
    .eq("is_active", true)
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  return data?.length ?? 0;
}

export async function getExistingNewsSlugsBySourceUrls(sourceUrls: string[]) {
  const rows = await getExistingNewsRowsBySourceUrls(sourceUrls);
  return rows.map((row) => ({ source_url: row.source_url, slug: row.slug }));
}

export async function getExistingNewsRowsBySourceUrls(
  sourceUrls: string[],
  provider: DatabaseProvider = getDatabaseProvider(),
) {
  if (sourceUrls.length === 0) {
    return [] as NewsRowRecord[];
  }

  if (provider === "postgres") {
    const { rows } = await queryPostgres<NewsRowRecord>(
      "select * from public.news where source_url = any($1::text[])",
      [sourceUrls],
    );
    return rows.map((row) => normalizeNewsRow(row));
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("news")
    .select("*")
    .in("source_url", sourceUrls);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => normalizeNewsRow(row as Record<string, unknown>));
}

async function upsertNewsRowsForProvider(provider: DatabaseProvider, rows: NewsRowRecord[]) {
  if (provider === "postgres") {
    const query = buildBulkUpsertQuery(
      "news",
      NEWS_COLUMNS,
      rows,
      ["source_url"],
      NEWS_COLUMNS.filter((column) => column !== "created_at"),
    );

    const { rows: result } = await queryPostgres<NewsRowRecord>(query.text, query.values);
    return result.map((row) => normalizeNewsRow(row));
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("news")
    .upsert(rows, { onConflict: "source_url" })
    .select("*");

  if (error) {
    if (isSupabaseMissingColumnError(new Error(error.message))) {
      const legacyRows = rows.map(stripUnsupportedSupabaseNewsRow);
      const fallback = await supabase
        .from("news")
        .upsert(legacyRows, { onConflict: "source_url" })
        .select("*");

      if (fallback.error) {
        throw new Error(fallback.error.message);
      }

      return (fallback.data ?? []).map((row) => normalizeNewsRow(row as Record<string, unknown>));
    }

    throw new Error(error.message);
  }

  return (data ?? []).map((row) => normalizeNewsRow(row as Record<string, unknown>));
}

export async function upsertNewsRows(rows: Array<Record<string, unknown>>) {
  if (rows.length === 0) {
    return [] as NewsRowRecord[];
  }

  const normalizedRows = rows.map((row) => normalizeNewsRow(row));
  const primaryProvider = getDatabaseProvider();
  const secondaryProvider = getSecondaryDatabaseProvider();
  const result = await upsertNewsRowsForProvider(primaryProvider, normalizedRows);

  if (secondaryProvider) {
    await upsertNewsRowsForProvider(secondaryProvider, normalizedRows);
  }

  return result;
}

export async function listUnenrichedNewsRows(limit: number) {
  if (getDatabaseProvider() === "postgres") {
    const { rows } = await queryPostgres<NewsRowRecord>(
      "select * from public.news where editorial_analysis is null and is_active = true order by published_at asc limit $1",
      [limit],
    );
    return rows.map((row) => normalizeNewsRow(row));
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("news")
    .select("*")
    .is("editorial_analysis", null)
    .eq("is_active", true)
    .order("published_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => normalizeNewsRow(row as Record<string, unknown>));
}

export async function listPendingNewsRowsForDelivery(
  channel: DeliveryChannel,
  fetchLimit: number,
  options?: { requireEditorial?: boolean },
) {
  const postedField = channel === "x" ? "posted_to_x_at" : "posted_to_linkedin_at";
  const requireEditorial = options?.requireEditorial ?? false;

  if (getDatabaseProvider() === "postgres") {
    const values: unknown[] = [fetchLimit];
    const editorialClause = requireEditorial ? "and editorial_analysis is not null" : "";
    const { rows } = await queryPostgres<NewsRowRecord>(
      `
        select *
        from public.news
        where is_active = true
          and ${postedField} is null
          ${editorialClause}
        order by published_at asc
        limit $1
      `,
      values,
    );
    return rows.map((row) => normalizeNewsRow(row));
  }

  const supabase = getSupabaseAdminClient();
  let query = supabase
    .from("news")
    .select("*")
    .eq("is_active", true)
    .is(postedField, null)
    .order("published_at", { ascending: true })
    .limit(fetchLimit);

  if (requireEditorial) {
    query = query.not("editorial_analysis", "is", null);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => normalizeNewsRow(row as Record<string, unknown>));
}

async function updateNewsRowBySlugForProvider(provider: DatabaseProvider, slug: string, patch: Record<string, unknown>) {
  if (provider === "postgres") {
    const query = buildUpdateNewsBySlugQuery(slug, patch);

    if (!query) {
      return;
    }

    await queryPostgres(query.text, query.values);
    return;
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("news")
    .update(patch)
    .eq("slug", slug);

  if (error) {
    if (isSupabaseMissingColumnError(new Error(error.message))) {
      const fallbackPatch = stripUnsupportedSupabaseNewsPatch(patch);

      if (Object.keys(fallbackPatch).length === 0) {
        return;
      }

      const fallback = await supabase
        .from("news")
        .update(fallbackPatch)
        .eq("slug", slug);

      if (fallback.error) {
        throw new Error(fallback.error.message);
      }

      return;
    }

    throw new Error(error.message);
  }
}

export async function updateNewsRowBySlug(slug: string, patch: Record<string, unknown>) {
  const primaryProvider = getDatabaseProvider();
  const secondaryProvider = getSecondaryDatabaseProvider();

  await updateNewsRowBySlugForProvider(primaryProvider, slug, patch);

  if (secondaryProvider) {
    await updateNewsRowBySlugForProvider(secondaryProvider, slug, patch);
  }
}

async function upsertNewsletterSubscriberForProvider(provider: DatabaseProvider, input: NewsletterSubscriberInsert) {
  if (provider === "postgres") {
    const { rows } = await queryPostgres(
      `
        insert into public.newsletter_subscribers (email, locale, source, consented_at)
        values ($1, $2, $3, $4)
        on conflict (email) do update
        set locale = excluded.locale,
            source = excluded.source,
            consented_at = excluded.consented_at
        returning email
      `,
      [input.email, input.locale, input.source, input.consented_at],
    );

    if (rows.length === 0) {
      throw new Error("Failed to upsert newsletter subscriber in PostgreSQL.");
    }

    return;
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("newsletter_subscribers")
    .upsert(input, { onConflict: "email" });

  if (error) {
    throw new Error(error.message);
  }
}

export async function upsertNewsletterSubscriber(input: NewsletterSubscriberInsert) {
  const primaryProvider = getDatabaseProvider();
  const secondaryProvider = getSecondaryDatabaseProvider();

  await upsertNewsletterSubscriberForProvider(primaryProvider, input);

  if (secondaryProvider) {
    await upsertNewsletterSubscriberForProvider(secondaryProvider, input);
  }
}

function toOptionalLocale(value: unknown) {
  if (value === "en" || value === "pt") {
    return value;
  }

  return null;
}

function toOptionalInteger(value: unknown) {
  if (typeof value === "number" && Number.isInteger(value)) {
    return value;
  }

  return null;
}

function toMetadataRecord(value: unknown) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function normalizeAnalyticsEvent(input: Record<string, unknown>): AnalyticsEventInsert {
  return {
    event_id: requireString(input.event_id, "event_id"),
    event_name: requireString(input.event_name, "event_name"),
    session_id: requireString(input.session_id, "session_id"),
    occurred_at: toTimestampString(input.occurred_at, "occurred_at"),
    page: toOptionalString(input.page),
    locale: toOptionalLocale(input.locale),
    page_type: toOptionalString(input.page_type),
    source_type: toOptionalString(input.source_type),
    source_slug: toOptionalString(input.source_slug),
    target_type: toOptionalString(input.target_type),
    target_slug: toOptionalString(input.target_slug),
    location: toOptionalString(input.location),
    depth: toOptionalInteger(input.depth),
    metadata: toMetadataRecord(input.metadata),
  };
}

async function insertAnalyticsEventsForProvider(
  provider: DatabaseProvider,
  events: AnalyticsEventInsert[],
) {
  if (events.length === 0) {
    return;
  }

  if (provider === "postgres") {
    const columns = [
      "event_id",
      "event_name",
      "session_id",
      "occurred_at",
      "page",
      "locale",
      "page_type",
      "source_type",
      "source_slug",
      "target_type",
      "target_slug",
      "location",
      "depth",
      "metadata",
    ] as const;
    const values: unknown[] = [];
    const tuples = events.map((event, rowIndex) => {
      const placeholders = columns.map((column, columnIndex) => {
        values.push(event[column]);
        return `$${rowIndex * columns.length + columnIndex + 1}`;
      });

      return `(${placeholders.join(", ")})`;
    });

    await queryPostgres(
      `
        insert into public.analytics_events (${columns.join(", ")})
        values ${tuples.join(", ")}
        on conflict (event_id) do nothing
      `,
      values,
    );
    return;
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("analytics_events")
    .upsert(events, { onConflict: "event_id", ignoreDuplicates: true });

  if (error) {
    throw new Error(error.message);
  }
}

export async function insertAnalyticsEvents(events: Array<Record<string, unknown>>) {
  if (events.length === 0) {
    return;
  }

  const normalizedEvents = events.map((event) => normalizeAnalyticsEvent(event));
  const primaryProvider = getDatabaseProvider();
  const secondaryProvider = getSecondaryDatabaseProvider();

  await insertAnalyticsEventsForProvider(primaryProvider, normalizedEvents);

  if (secondaryProvider) {
    await insertAnalyticsEventsForProvider(secondaryProvider, normalizedEvents);
  }
}
