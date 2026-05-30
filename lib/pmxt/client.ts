import "server-only";
import pmxt, { Router } from "pmxtjs";

/**
 * Single chokepoint for all PMXT access. Nothing else in the app imports
 * `pmxtjs` directly — this keeps the API key server-side and makes a future
 * vendor swap or fallback a one-file change (see TECHNICAL_DESIGN §11).
 */

let cached: Router | null = null;

export class PmxtConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PmxtConfigError";
  }
}

/**
 * Lazily construct the Router. The PMXT API key is read from the server-only
 * `PMXT_API_KEY` env var and is never exposed to the client.
 */
export function getRouter(): Router {
  if (cached) return cached;

  const pmxtApiKey = process.env.PMXT_API_KEY;
  if (!pmxtApiKey) {
    throw new PmxtConfigError(
      "PMXT_API_KEY is not set. Add it to your environment (see .env.example).",
    );
  }

  cached = new pmxt.Router({
    pmxtApiKey,
    ...(process.env.PMXT_API_BASE ? { baseUrl: process.env.PMXT_API_BASE } : {}),
  });
  return cached;
}

/** True when a PMXT key is configured — lets the UI render a setup hint instead of erroring. */
export function isPmxtConfigured(): boolean {
  return Boolean(process.env.PMXT_API_KEY);
}
