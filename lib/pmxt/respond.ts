import "server-only";
import { NextResponse } from "next/server";
import { PmxtConfigError } from "./client";

/** Uniform JSON envelope for route handlers, mirroring PMXT's success shape. */
export function ok<T>(data: T, fetchedAt: number) {
  return NextResponse.json({ success: true, data, fetchedAt });
}

/**
 * Detect a config error. Errors thrown inside `use cache` functions are
 * reconstructed across the cache boundary and can lose their prototype, so we
 * also match on `name`.
 */
function isConfigError(error: unknown): boolean {
  return (
    error instanceof PmxtConfigError ||
    (error instanceof Error && error.name === "PmxtConfigError")
  );
}

export function fail(error: unknown) {
  if (isConfigError(error)) {
    const message = error instanceof Error ? error.message : "PMXT is not configured.";
    return NextResponse.json(
      { success: false, error: { message, code: "NOT_CONFIGURED" } },
      { status: 503 },
    );
  }
  const message = error instanceof Error ? error.message : "Unknown error";
  return NextResponse.json(
    { success: false, error: { message, code: "PMXT_ERROR" } },
    { status: 502 },
  );
}
