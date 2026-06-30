export type DeliveryChannel = "x" | "linkedin";
export type DeliveryStatus = "pending" | "publishing" | "retry" | "posted" | "dead_letter";

type DeliveryFieldMap = {
  postedAt: string;
  status: string;
  attemptCount: string;
  lastAttemptAt: string;
  nextRetryAt: string;
  lastError: string;
  externalPostId: string;
};

const DELIVERY_FIELDS: Record<DeliveryChannel, DeliveryFieldMap> = {
  x: {
    postedAt: "posted_to_x_at",
    status: "x_post_status",
    attemptCount: "x_attempt_count",
    lastAttemptAt: "x_last_attempt_at",
    nextRetryAt: "x_next_retry_at",
    lastError: "x_last_error",
    externalPostId: "x_external_post_id",
  },
  linkedin: {
    postedAt: "posted_to_linkedin_at",
    status: "linkedin_post_status",
    attemptCount: "linkedin_attempt_count",
    lastAttemptAt: "linkedin_last_attempt_at",
    nextRetryAt: "linkedin_next_retry_at",
    lastError: "linkedin_last_error",
    externalPostId: "linkedin_external_post_id",
  },
};

const MAX_DELIVERY_ATTEMPTS = 5;
export const STALE_PUBLISHING_MS = 2 * 60 * 60 * 1000;

export function getDeliveryFieldMap(channel: DeliveryChannel) {
  return DELIVERY_FIELDS[channel];
}

export function buildDeliverySelectColumns(
  channel: DeliveryChannel,
  baseColumns: string[],
) {
  const fields = getDeliveryFieldMap(channel);
  return [...baseColumns, ...Object.values(fields)].join(", ");
}

export function supportsDeliveryQueue(
  row: Record<string, unknown> | null | undefined,
  channel: DeliveryChannel,
) {
  if (!row) {
    return false;
  }

  const fields = getDeliveryFieldMap(channel);
  return Object.values(fields).every((field) => field in row);
}

function parseIso(value: unknown) {
  if (typeof value !== "string" || value.length === 0) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function getComparableDate(row: Record<string, unknown>, field: string) {
  return parseIso(row[field])?.getTime() ?? 0;
}

export function selectDueDeliveryRows<T extends Record<string, unknown>>(
  rows: T[],
  channel: DeliveryChannel,
  limit: number,
) {
  const fields = getDeliveryFieldMap(channel);
  const now = Date.now();

  return rows
    .filter((row) => row[fields.postedAt] == null)
    .filter((row) => {
      const status = (row[fields.status] as DeliveryStatus | null | undefined) ?? "pending";

      if (status === "dead_letter" || status === "posted") {
        return false;
      }

      if (status === "publishing") {
        const lastAttemptAt = parseIso(row[fields.lastAttemptAt]);
        return !lastAttemptAt || now - lastAttemptAt.getTime() >= STALE_PUBLISHING_MS;
      }

      const nextRetryAt = parseIso(row[fields.nextRetryAt]);
      return !nextRetryAt || nextRetryAt.getTime() <= now;
    })
    .sort((left, right) => {
      const leftRetryAt = getComparableDate(left, fields.nextRetryAt);
      const rightRetryAt = getComparableDate(right, fields.nextRetryAt);

      if (leftRetryAt !== rightRetryAt) {
        return leftRetryAt - rightRetryAt;
      }

      const leftPublishedAt = getComparableDate(left, "published_at");
      const rightPublishedAt = getComparableDate(right, "published_at");
      return leftPublishedAt - rightPublishedAt;
    })
    .slice(0, limit);
}

function getBackoffDelayMs(attemptCount: number) {
  const baseDelayMs = 15 * 60 * 1000;
  const cappedAttempt = Math.max(1, Math.min(attemptCount, MAX_DELIVERY_ATTEMPTS));
  return Math.min(baseDelayMs * 2 ** (cappedAttempt - 1), 24 * 60 * 60 * 1000);
}

export function buildDeliveryFailurePatch(
  channel: DeliveryChannel,
  attemptCount: number,
  errorMessage: string,
  now = new Date(),
) {
  const fields = getDeliveryFieldMap(channel);
  const deadLetter = attemptCount >= MAX_DELIVERY_ATTEMPTS;

  return {
    [fields.attemptCount]: attemptCount,
    [fields.lastAttemptAt]: now.toISOString(),
    [fields.lastError]: errorMessage.slice(0, 500),
    [fields.nextRetryAt]: deadLetter
      ? null
      : new Date(now.getTime() + getBackoffDelayMs(attemptCount)).toISOString(),
    [fields.status]: deadLetter ? "dead_letter" : "retry",
  };
}

export function buildDeliverySuccessPatch(
  channel: DeliveryChannel,
  attemptCount: number,
  externalPostId: string | null,
  nowIso = new Date().toISOString(),
) {
  const fields = getDeliveryFieldMap(channel);

  return {
    [fields.attemptCount]: attemptCount,
    [fields.lastAttemptAt]: nowIso,
    [fields.lastError]: null,
    [fields.nextRetryAt]: null,
    [fields.externalPostId]: externalPostId,
    [fields.postedAt]: nowIso,
    [fields.status]: "posted",
  };
}
