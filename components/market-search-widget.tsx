"use client";

import { MarketSearch, PmxtProvider } from "pmxt-widgets";

/**
 * PMXT MarketSearch widget — one search across every venue, with cross-venue
 * matched results and an expanded, tradable card on pick. Replaces the old
 * URL-driven `SearchBox` (see `components/search-box.tsx`, kept for reference).
 *
 * Wrapped in `PmxtProvider`, pointed at our same-origin proxy routes:
 *   - `/api/pmxt`  — read-only catalog data, attaches the server `PMXT_API_KEY`.
 *   - `/api/trade` — non-custodial trading; requires the user's own PMXT key.
 *
 * The API key stays server-side; the browser only ever talks to our proxies.
 */
export function MarketSearchWidget() {
  return (
    <PmxtProvider config={{ apiUrl: "/api/pmxt", tradeUrl: "/api/trade" }}>
      <MarketSearch placeholder="Search every prediction market — “election”, “Bitcoin $100k”, “Fed cut”…" />
    </PmxtProvider>
  );
}
