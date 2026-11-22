import { toErrorMessage } from "@/lib/runtime";

const NETWORK_RESET_CODES = new Set([
  "ECONNRESET",
  "ECONNABORTED",
  "ETIMEDOUT",
]);

export class LinkedinHttpError extends Error {
  readonly status: number;

  constructor(status: number, detail = "") {
    super(
      detail ? `LinkedIn API ${status}: ${detail}` : `LinkedIn API ${status}`
    );
    this.name = "LinkedinHttpError";
    this.status = status;
  }
}

/**
 * 2xx create responses are success. Never throw, so a created post cannot be retried.
 * Non-2xx throws LinkedinHttpError carrying the parsed status (not a substring match).
 */
export function linkedinPostIdFromCreateResponse(
  status: number,
  postId: string | null | undefined,
  errorDetail = ""
): string {
  if (status >= 200 && status < 300) {
    const trimmed = postId?.trim();
    return trimmed ? trimmed : "unknown";
  }

  throw new LinkedinHttpError(status, errorDetail);
}

export function isRetryableLinkedinPublishError(error: unknown): boolean {
  const status = readHttpStatus(error);
  if (status !== null) {
    if (status >= 200 && status < 300) {
      return false;
    }

    return status === 429 || (status >= 500 && status <= 599);
  }

  return isNetworkTimeoutOrReset(error);
}

function readHttpStatus(error: unknown): number | null {
  if (error instanceof LinkedinHttpError) {
    return error.status;
  }

  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status?: unknown }).status;
    if (
      typeof status === "number" &&
      Number.isInteger(status) &&
      status >= 100 &&
      status <= 599
    ) {
      return status;
    }
  }

  const match = /^LinkedIn API (\d{3})\b/.exec(toErrorMessage(error));
  return match ? Number(match[1]) : null;
}

function isNetworkTimeoutOrReset(error: unknown): boolean {
  const seen = new Set<unknown>();
  let current: unknown = error;

  while (current != null && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    const record = current as {
      cause?: unknown;
      code?: unknown;
      message?: unknown;
      name?: unknown;
    };
    const code = typeof record.code === "string" ? record.code : "";
    const name = typeof record.name === "string" ? record.name : "";
    const message = typeof record.message === "string" ? record.message : "";

    if (
      NETWORK_RESET_CODES.has(code) ||
      /TIMEOUT/.test(code) ||
      name === "TimeoutError"
    ) {
      return true;
    }

    if (
      /\bECONNRESET\b/.test(message) ||
      /\bETIMEDOUT\b/.test(message) ||
      /timeout/i.test(message)
    ) {
      return true;
    }

    current = record.cause;
  }

  return false;
}
