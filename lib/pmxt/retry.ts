import "server-only";

const TRANSIENT =
  /ECONNRESET|ETIMEDOUT|ENOTFOUND|socket hang up|network|429|502|503|504|rate.?limit|temporarily unavailable/i;

/**
 * SSL/TLS protocol errors are permanent configuration failures, not transient
 * blips. Matching "fetch failed" alone is too broad — it also catches TLS
 * errors — so we exclude them here and let the generic "fetch failed" case
 * below handle real network drops only when no SSL cause is present.
 */
const SSL_ERROR =
  /ssl|tls|EPROTO|packet length|alert protocol|certificate|handshake/i;

function errorText(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const cause = error.cause instanceof Error ? error.cause.message : "";
  return `${error.name}: ${error.message} ${cause}`.trim();
}

/** True for network blips and rate limits — not auth/config or SSL failures. */
export function isTransientPmxtError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if (error.name === "PmxtConfigError") return false;
  const text = errorText(error);
  // SSL/TLS errors are permanent — never retry them.
  if (SSL_ERROR.test(text)) return false;
  if (TRANSIENT.test(text)) return true;
  // "fetch failed" without a TLS cause is a transient connection drop.
  if (error.message === "fetch failed" && !SSL_ERROR.test(text)) return true;
  return false;
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
