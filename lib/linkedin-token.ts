const USERINFO_URL = "https://api.linkedin.com/v2/userinfo";
const DEFAULT_EXPIRING_WITHIN_MS = 48 * 60 * 60 * 1000;

export type LinkedInTokenReason = "missing" | "invalid" | "expired" | "expiring";

export type LinkedInTokenInspection = {
  ok: boolean;
  reason?: LinkedInTokenReason;
  /** Non-fatal probe note. Never includes the token or response body. */
  warning?: string;
};

type InspectOptions = {
  now?: number;
  expiringWithinMs?: number;
  fetchImpl?: typeof fetch;
};

function decodeBase64Url(value: string): string | null {
  try {
    return Buffer.from(value, "base64url").toString("utf8");
  } catch {
    return null;
  }
}

/** Read `exp` (milliseconds) from a JWT access token. Opaque tokens return null. */
export function readLinkedInJwtExpiryMs(token: string): number | null {
  const parts = token.split(".");
  if (parts.length !== 3 || parts.some((part) => part.length === 0)) {
    return null;
  }

  const payloadText = decodeBase64Url(parts[1]);
  if (!payloadText) {
    return null;
  }

  try {
    const payload = JSON.parse(payloadText) as { exp?: unknown };
    if (typeof payload.exp !== "number" || !Number.isFinite(payload.exp)) {
      return null;
    }
    return payload.exp * 1000;
  } catch {
    return null;
  }
}

export function describeLinkedInTokenFailure(reason: LinkedInTokenReason): string {
  switch (reason) {
    case "missing":
      return "LINKEDIN_ACCESS_TOKEN is not set.";
    case "invalid":
      return "LINKEDIN_ACCESS_TOKEN is invalid (LinkedIn /v2/userinfo returned 401). Regenerate it at https://www.linkedin.com/developers/apps/ and update the GitHub Actions secret.";
    case "expired":
      return "LINKEDIN_ACCESS_TOKEN is expired. Regenerate it at https://www.linkedin.com/developers/apps/ and update the GitHub Actions secret.";
    case "expiring":
      return "LINKEDIN_ACCESS_TOKEN expires within 48 hours. Regenerate it at https://www.linkedin.com/developers/apps/ and update the GitHub Actions secret before the next post.";
    default:
      return "LINKEDIN_ACCESS_TOKEN cannot be used.";
  }
}

/**
 * Probe a LinkedIn access token without logging it or the response body.
 * 401 and a JWT `exp` that is past or inside the warning window fail closed.
 * 403 (missing userinfo scope) and transient HTTP errors do not, so a scope
 * gap or an outage is not reported as an expired token.
 */
export async function inspectLinkedInAccessToken(
  token: string | undefined,
  options: InspectOptions = {},
): Promise<LinkedInTokenInspection> {
  if (!token || token.trim().length === 0) {
    return { ok: false, reason: "missing" };
  }

  const now = options.now ?? Date.now();
  const expiringWithinMs = options.expiringWithinMs ?? DEFAULT_EXPIRING_WITHIN_MS;
  const expiryMs = readLinkedInJwtExpiryMs(token);
  if (expiryMs !== null) {
    if (expiryMs <= now) {
      return { ok: false, reason: "expired" };
    }
    if (expiryMs - now <= expiringWithinMs) {
      return { ok: false, reason: "expiring" };
    }
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  let response: Response;
  try {
    response = await fetchImpl(USERINFO_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    return { ok: true, warning: "LinkedIn /v2/userinfo could not be reached; continuing." };
  }

  await response.arrayBuffer().catch(() => undefined);

  if (response.status === 401) {
    return { ok: false, reason: "invalid" };
  }

  if (response.status === 403) {
    return {
      ok: true,
      warning: "LinkedIn /v2/userinfo returned 403 (profile scope missing); token was not treated as expired.",
    };
  }

  if (!response.ok) {
    return {
      ok: true,
      warning: `LinkedIn /v2/userinfo returned ${response.status}; token was not treated as expired.`,
    };
  }

  return { ok: true };
}
