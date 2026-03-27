type RetryOptions = {
  attempts?: number;
  delayMs?: number;
  maxDelayMs?: number;
  factor?: number;
  jitterMs?: number;
  label?: string;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  onRetry?: (error: unknown, attempt: number, nextDelayMs: number) => void;
};

export function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Unknown error";
}

export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  {
    attempts = 4,
    delayMs = 1000,
    maxDelayMs = 30_000,
    factor = 2,
    jitterMs = 250,
    shouldRetry,
    onRetry,
  }: RetryOptions = {},
): Promise<T> {
  let currentDelay = delayMs;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn(attempt);
    } catch (error) {
      const canRetry = attempt < attempts && (shouldRetry ? shouldRetry(error, attempt) : true);

      if (!canRetry) {
        throw error;
      }

      const nextDelayMs = Math.min(
        maxDelayMs,
        currentDelay + Math.floor(Math.random() * jitterMs),
      );

      onRetry?.(error, attempt, nextDelayMs);
      await sleep(nextDelayMs);
      currentDelay = Math.min(maxDelayMs, Math.round(currentDelay * factor));
    }
  }

  throw new Error("Retry loop exited unexpectedly.");
}

export async function fetchWithTimeout(
  input: string | URL,
  init: RequestInit & { timeoutMs?: number } = {},
) {
  const { timeoutMs = 10_000, signal, ...rest } = init;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const abortListener = () => controller.abort();
  signal?.addEventListener("abort", abortListener);

  try {
    return await fetch(input, {
      ...rest,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abortListener);
  }
}

export function chunkArray<T>(items: T[], size: number) {
  if (size <= 0) {
    throw new Error("chunk size must be positive");
  }

  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}
