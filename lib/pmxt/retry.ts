import "server-only";

const TRANSIENT =
  /fetch failed|ECONNRESET|ETIMEDOUT|ENOTFOUND|socket hang up|network|429|502|503|504|rate.?limit|temporarily unavailable/i;

function errorText(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const cause = error.cause instanceof Error ? error.cause.message : "";
  return `${error.name}: ${error.message} ${cause}`.trim();
}

/** True for network blips and rate limits — not auth/config failures. */
export function isTransientPmxtError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if (error.name === "PmxtConfigError") return false;
  return TRANSIENT.test(errorText(error));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry PMXT Router calls on transient failures. PMXT documents these as
 * retryable network/rate-limit issues (see pmxt.dev/docs/api-reference/overview).
 */
export async function withPmxtRetry<T>(
  fn: () => Promise<T>,
  opts: { attempts?: number; baseMs?: number } = {},
): Promise<T> {
  const attempts = opts.attempts ?? 3;
  const baseMs = opts.baseMs ?? 400;

  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (!isTransientPmxtError(err) || i === attempts - 1) throw err;
      await sleep(baseMs * 2 ** i);
    }
  }
  throw lastError;
}
