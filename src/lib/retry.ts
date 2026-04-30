/**
 * Generic retry wrapper with exponential backoff.
 * Only retries on network errors and 5xx-class failures.
 * 4xx errors are never retried (they indicate bad input, not transience).
 */

type RetryOptions = {
  /** Maximum number of retry attempts (default: 2) */
  maxRetries?: number;
  /** Initial backoff delay in ms (default: 600) */
  baseDelayMs?: number;
  /** Label for console logging (default: "request") */
  label?: string;
};

/**
 * Wraps an async function with retry + exponential backoff.
 * @param fn — The async operation to retry
 * @param options — Retry configuration
 * @returns The resolved value of fn
 * @throws The last error if all retries are exhausted
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 2, baseDelayMs = 600, label = "request" } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      // Don't retry if it's a client error (4xx) — these won't fix themselves
      if (err instanceof RetryableError && !err.retryable) {
        throw err;
      }

      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt); // 600, 1200, 2400
        console.warn(
          `[retry] ${label} attempt ${attempt + 1}/${maxRetries + 1} failed, retrying in ${delay}ms…`
        );
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

/**
 * Wraps a fetch call with retry-awareness.
 * Throws RetryableError for 5xx (retryable) and non-retryable for 4xx.
 */
export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  options: RetryOptions = {}
): Promise<Response> {
  return withRetry(async () => {
    const response = await fetch(url, init);

    if (response.ok) return response;

    // 4xx → don't retry
    if (response.status >= 400 && response.status < 500) {
      throw new RetryableError(
        `HTTP ${response.status}: ${response.statusText}`,
        false
      );
    }

    // 5xx → retryable
    throw new RetryableError(
      `HTTP ${response.status}: ${response.statusText}`,
      true
    );
  }, options);
}

export class RetryableError extends Error {
  retryable: boolean;
  constructor(message: string, retryable: boolean) {
    super(message);
    this.name = "RetryableError";
    this.retryable = retryable;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
