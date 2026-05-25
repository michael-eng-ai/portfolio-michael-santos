import { getBotState, setBotState } from "@/lib/bot-state";
import { toErrorMessage } from "@/lib/runtime";

const X_CREDITS_STATE_KEY = "x.credits_depleted";
const X_BILLING_BLOCK_STATE_KEY = "x.billing_block";
const X_BILLING_USAGE_STATE_KEY = "x.billing_usage";
const DEFAULT_COOLDOWN_HOURS = 24;
const DEFAULT_DAILY_REQUEST_LIMIT = 25;
const DEFAULT_DAILY_ERROR_LIMIT = 3;

type XCreditsDepletedState = {
  until: string;
  lastSeenAt: string;
  context: string;
  reason: string;
};

type XBillingBlockState = {
  until: string;
  lastSeenAt: string;
  context: string;
  reason: string;
};

type XBillingUsageState = {
  date: string;
  requests: number;
  errors: number;
  lastContext?: string;
  updatedAt: string;
};

function billingGuardEnabled(): boolean {
  return process.env.X_BILLING_GUARD_ENABLED !== "false";
}

function cooldownHours(): number {
  const raw = Number(process.env.X_CREDITS_COOLDOWN_HOURS ?? DEFAULT_COOLDOWN_HOURS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_COOLDOWN_HOURS;
}

function dailyRequestLimit(): number {
  const raw = Number(process.env.X_DAILY_REQUEST_LIMIT ?? DEFAULT_DAILY_REQUEST_LIMIT);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : DEFAULT_DAILY_REQUEST_LIMIT;
}

function dailyErrorLimit(): number {
  const raw = Number(process.env.X_DAILY_ERROR_LIMIT ?? DEFAULT_DAILY_ERROR_LIMIT);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : DEFAULT_DAILY_ERROR_LIMIT;
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function nextUtcDayIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)).toISOString();
}

function getErrorData(error: unknown): unknown {
  if (error && typeof error === "object" && "data" in error) {
    return (error as Record<string, unknown>).data;
  }

  return undefined;
}

function getErrorCode(error: unknown): number | undefined {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  const candidate = error as Record<string, unknown>;
  const code = candidate.code ?? candidate.statusCode ?? candidate.status;

  return typeof code === "number" ? code : undefined;
}

function describeError(error: unknown): string {
  const message = toErrorMessage(error);
  const data = getErrorData(error);

  if (!data) {
    return message;
  }

  return `${message} | ${JSON.stringify(data)}`;
}

function freshUsageState(): XBillingUsageState {
  return {
    date: todayUtc(),
    requests: 0,
    errors: 0,
    updatedAt: new Date().toISOString(),
  };
}

async function getUsageState(): Promise<XBillingUsageState> {
  const state = await getBotState<XBillingUsageState>(X_BILLING_USAGE_STATE_KEY);

  if (!state || state.date !== todayUtc()) {
    return freshUsageState();
  }

  return {
    ...state,
    requests: Number(state.requests ?? 0),
    errors: Number(state.errors ?? 0),
  };
}

async function setBillingBlock(context: string, reason: string, until = nextUtcDayIso()): Promise<void> {
  await setBotState(X_BILLING_BLOCK_STATE_KEY, {
    until,
    lastSeenAt: new Date().toISOString(),
    context,
    reason,
  } satisfies XBillingBlockState);

  console.warn(`X billing guard blocked API calls until ${until}. Context: ${context}. Reason: ${reason}`);
}

async function isDateBlockActive<T extends { until?: string; reason?: string }>(
  key: string,
  context: string,
  label: string,
): Promise<boolean> {
  let state: T | null = null;
  try {
    state = await getBotState<T>(key);
  } catch (error) {
    // The billing guard relies on a Postgres bot_state table that only
    // exists on the worker VM. CI runs of post-news-to-x don't have
    // DATABASE_URL configured, so getBotState throws. Treat this as
    // "no block recorded" rather than failing the whole publish step:
    // the X API call itself will report the real billing error, and the
    // next VM run will record the block.
    const message = error instanceof Error ? error.message : String(error);
    console.warn(
      `X billing guard could not read state for ${context} (${message}). ` +
      "Proceeding without block — the X API will surface any real error.",
    );
    return false;
  }

  if (!state?.until) {
    return false;
  }

  const until = Date.parse(state.until);

  if (!Number.isFinite(until) || until <= Date.now()) {
    return false;
  }

  console.warn(`SKIPPED: ${label}; ${context} paused until ${state.until}. Reason: ${state.reason ?? "not recorded"}`);
  return true;
}

export function isXCreditsDepletedError(error: unknown): boolean {
  const message = toErrorMessage(error).toLowerCase();
  const data = getErrorData(error);
  const dataText = data ? JSON.stringify(data).toLowerCase() : "";
  const code = getErrorCode(error);
  const combined = `${message} ${dataText}`;

  return (
    combined.includes("creditsdepleted") ||
    combined.includes("/problems/credits") ||
    (code === 402 && combined.includes("credit"))
  );
}

export async function shouldSkipXDueToBillingGuard(context: string): Promise<boolean> {
  if (!billingGuardEnabled()) {
    return false;
  }

  if (
    await isDateBlockActive<XCreditsDepletedState>(
      X_CREDITS_STATE_KEY,
      context,
      "X credits are depleted",
    )
  ) {
    return true;
  }

  return isDateBlockActive<XBillingBlockState>(
    X_BILLING_BLOCK_STATE_KEY,
    context,
    "X billing guard is active",
  );
}

export async function reserveXApiRequest(context: string): Promise<boolean> {
  if (!billingGuardEnabled()) {
    return true;
  }

  if (await shouldSkipXDueToBillingGuard(context)) {
    return false;
  }

  try {
    const limit = dailyRequestLimit();
    const state = await getUsageState();

    if (state.requests >= limit) {
      await setBillingBlock(context, `daily X request limit reached (${state.requests}/${limit})`);
      return false;
    }

    await setBotState(X_BILLING_USAGE_STATE_KEY, {
      ...state,
      requests: state.requests + 1,
      lastContext: context,
      updatedAt: new Date().toISOString(),
    } satisfies XBillingUsageState);

    return true;
  } catch (error) {
    // DB unavailable (typical in CI without DATABASE_URL). Allow the
    // request through; the X API call itself is the source of truth.
    const message = error instanceof Error ? error.message : String(error);
    console.warn(
      `X billing guard could not reserve quota for ${context} (${message}). ` +
      "Proceeding without quota tracking.",
    );
    return true;
  }
}

export async function recordXApiError(error: unknown, context: string): Promise<void> {
  if (!billingGuardEnabled()) {
    return;
  }

  try {
    if (isXCreditsDepletedError(error)) {
      await markXCreditsDepleted(error, context);
      return;
    }

    const limit = dailyErrorLimit();
    const state = await getUsageState();
    const nextErrors = state.errors + 1;

    await setBotState(X_BILLING_USAGE_STATE_KEY, {
      ...state,
      errors: nextErrors,
      lastContext: context,
      updatedAt: new Date().toISOString(),
    } satisfies XBillingUsageState);

    if (nextErrors >= limit) {
      await setBillingBlock(context, `daily X error limit reached (${nextErrors}/${limit}): ${describeError(error)}`);
    }
  } catch (recordingError) {
    // DB unavailable. Surface the recording failure but don't propagate
    // (the caller already has its own error to handle).
    const message = recordingError instanceof Error ? recordingError.message : String(recordingError);
    console.warn(
      `X billing guard could not record error for ${context} (${message}). ` +
      "The original X API error is still propagated by the caller.",
    );
  }
}

export async function markXCreditsDepleted(error: unknown, context: string): Promise<void> {
  const now = new Date();
  const until = new Date(now.getTime() + cooldownHours() * 60 * 60 * 1000);
  const reason = describeError(error);

  await setBotState(X_CREDITS_STATE_KEY, {
    until: until.toISOString(),
    lastSeenAt: now.toISOString(),
    context,
    reason,
  } satisfies XCreditsDepletedState);

  console.warn(`X credits depleted during ${context}; pausing X API calls until ${until.toISOString()}`);
}
