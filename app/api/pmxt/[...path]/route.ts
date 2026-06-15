import { NextRequest, NextResponse } from "next/server";

/**
 * Catalog proxy for the PMXT builder widgets (`MarketSearch`, etc.).
 *
 * The widgets' `PmxtClient` is configured with `apiUrl: "/api/pmxt"` and appends
 * paths like `/api/<venue>/fetchMarkets` or `/v0/matched-market-clusters`. This
 * route forwards those to the real catalog API and attaches the server-side
 * `PMXT_API_KEY` as a Bearer token, so the key never ships to the browser.
 *
 * Read-only and allowlisted: only the handful of catalog methods the widgets
 * actually call are forwarded; everything else 404s.
 *
 * No `export const dynamic` here: under Next 16 Cache Components that route
 * segment config is disallowed. Reading the request query/headers already
 * makes this handler dynamic, and the upstream `fetch` uses `cache: "no-store"`.
 */

const CATALOG_BASE = process.env.PMXT_API_BASE ?? "https://api.pmxt.dev";

/** Methods reachable as `api/<venue>/<method>` (venue includes the `router` pseudo-venue). */
const ALLOWED_METHODS = new Set([
  "fetchMarkets",
  "fetchMarketsPaginated",
  "fetchMarket",
  "fetchEvents",
  "fetchEventsPaginated",
  "fetchEvent",
  "fetchOrderBook",
  "fetchOHLCV",
  "fetchTrades",
  "fetchMarketMatches",
  "fetchEventMatches",
  "getExecutionPrice",
]);

/** Cross-venue cluster endpoints the widgets read for matched results. */
const ALLOWED_V0 = new Set([
  "matched-market-clusters",
  "matched-event-clusters",
]);

function isAllowed(segments: string[]): boolean {
  if (segments.length === 2 && segments[0] === "v0" && ALLOWED_V0.has(segments[1])) {
    return true;
  }
  if (
    segments.length === 3 &&
    segments[0] === "api" &&
    ALLOWED_METHODS.has(segments[2])
  ) {
    return true;
  }
  return false;
}

async function handle(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;

  if (!isAllowed(path)) {
    return NextResponse.json(
      { success: false, error: { message: "Endpoint not allowed", code: "NOT_ALLOWED" } },
      { status: 404 },
    );
  }

  const apiKey = process.env.PMXT_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: { message: "PMXT_API_KEY is not set.", code: "NOT_CONFIGURED" } },
      { status: 503 },
    );
  }

  const upstream = new URL(`${CATALOG_BASE.replace(/\/$/, "")}/${path.join("/")}`);
  upstream.search = request.nextUrl.search;

  const init: RequestInit = {
    method: request.method,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...(request.method === "POST" ? { "Content-Type": "application/json" } : {}),
    },
    cache: "no-store",
  };
  if (request.method === "POST") {
    init.body = await request.text();
  }

  const res = await fetch(upstream, init);
  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "application/json",
      "Cache-Control": "no-store",
    },
  });
}

export const GET = handle;
export const POST = handle;
