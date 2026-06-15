"use client";

import { MatchedMarkets, PmxtProvider } from "pmxt-widgets";

/**
 * PMXT MatchedMarkets widget — PMXT's signature cross-venue view: the same
 * question matched across venues with the YES price spread highlighted. Legs
 * expand into an inline trade ticket. This is our arb/compare surface.
 *
 * Wrapped in `PmxtProvider`, pointed at our same-origin proxy routes:
 *   - `/api/pmxt`  — read-only catalog data, attaches the server `PMXT_API_KEY`.
 *   - `/api/trade` — non-custodial trading; requires the user's own PMXT key.
 *
 * The API key stays server-side; the browser only ever talks to our proxies.
 */
export function MatchedMarketsWidget({ limit = 12 }: { limit?: number }) {
  // MatchedMarkets over-fetches `limit * 4` clusters and `useClusters` floors
  // the request at 50, so `limit={12}` keeps the request at exactly 50 (the
  // package minimum) while displaying as many matched clusters as possible.
  return (
    <PmxtProvider config={{ apiUrl: "/api/pmxt", tradeUrl: "/api/trade" }}>
      <MatchedMarkets limit={limit} />
    </PmxtProvider>
  );
}
