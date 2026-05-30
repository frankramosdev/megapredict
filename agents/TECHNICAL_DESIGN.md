# megapredict — Technical Design Document

**Status:** Draft v0.2
**Last updated:** 2026-05-29
**Owner:** TBD
**Companion to:** `agents/PRD.md`

> **v0.2 change:** All market data comes from the **PMXT API** (`https://api.pmxt.dev`,
> docs: https://www.pmxt.dev/docs). Frontend is **Next.js 16** (latest). PMXT already
> provides the unified schema, cross-venue search, matching/clustering, and price
> comparison — so megapredict does **not** build its own ingestion, normalization,
> matching, or market database.

---

## 1. Scope & Objectives

Covers the **v1 read-only aggregator + screener** from the PRD.

**Out of scope (per PRD):** trading/execution, wallets/custody, portfolio/P&L, alerts,
native mobile. (PMXT supports trading via venue exchanges + credentials; we intentionally
defer it.)

### Design objectives (priority order)
1. **Trustworthy data & honest gaps** — use PMXT relation/confidence so we never present a
   false arb.
2. **Fast cross-venue search & screening** — lean on PMXT's catalog (~10ms reads).
3. **Thin, cheap app tier** — Next.js 16 with aggressive caching; stay within PMXT rate limits.
4. **No data infrastructure to operate** — no ingestion workers, no market DB, no matching jobs.

---

## 2. Why PMXT Changes the Architecture

The original v0.1 design proposed building venue adapters, a normalized Postgres store, and a
matching/dedup pipeline (embeddings + LLM). **PMXT already provides all of that:**

| v0.1 component (now dropped) | Replaced by PMXT |
|---|---|
| Per-venue adapters + ingestion workers | PMXT catalog (continuously updated from every venue) |
| Normalized data model / Postgres of markets | `UnifiedEvent` → `UnifiedMarket` → `UnifiedOutcome` schema |
| Matching/dedup pipeline (the core risk) | Router matched clusters: embedding similarity + LLM-verified relations w/ confidence |
| Cross-venue gap computation | `compareMarketPrices` (bestBid/bestAsk per venue) |
| Search index | Router `fetchMarkets` / `fetchEvents` |

**megapredict becomes a Next.js 16 application that renders PMXT data.** Our engineering
effort shifts entirely to product/UX, caching, and presentation.

---

## 3. High-Level Architecture

```
   ┌──────────────────────────────────────────────────────────┐
   │                      Browser (client)                     │
   │   Search · Screener table · Comparison view (RSC + client)│
   └───────────────┬───────────────────────────▲──────────────┘
                   │ (filters, search input)    │ HTML / RSC payload
                   ▼                             │
   ┌──────────────────────────────────────────────────────────┐
   │                  Next.js 16 (App Router, Vercel)          │
   │                                                           │
   │  Server Components ──┐   Route Handlers ──┐               │
   │   (initial reads)    │    (client-driven  │               │
   │                      │     search/filter) │               │
   │                      ▼                    ▼               │
   │            ┌────────────────────────────────────┐         │
   │            │  PMXT data layer (server-only)      │         │
   │            │  - pmxtjs Router client             │         │
   │            │  - API key from env (secret)        │         │
   │            │  - `use cache` + cacheLife/cacheTag │         │
   │            └──────────────┬─────────────────────┘         │
   └───────────────────────────┼──────────────────────────────┘
                               │  Authorization: Bearer pmxt_live_...
                               ▼
                  ┌─────────────────────────────┐
                  │  PMXT API (api.pmxt.dev)     │
                  │  Router: search, clusters,   │
                  │  compareMarketPrices, events │
                  │  (Postgres catalog, ~10ms)   │
                  └─────────────────────────────┘
```

**Key principle:** the PMXT API key and all PMXT calls live **server-side only**. The browser
never sees the key and never calls PMXT directly.

---

## 4. Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 16** (App Router, latest) | Turbopack default; React Server Components; Cache Components |
| Language | **TypeScript** | Matches `pmxtjs` SDK |
| Data SDK | **`pmxtjs`** (PMXT Router) | `npm install pmxtjs`; sole data source |
| Hosting | **Vercel** | Native Next 16 support, preview deploys, env management |
| Caching | **Next.js 16 Cache Components** (`use cache`, `cacheLife`, `cacheTag`) + Vercel Runtime Cache | Reduce PMXT calls, control freshness |
| UI | **React + Tailwind + shadcn/ui** | Dense screener table, comparison view |
| App DB (optional, later) | Postgres (Neon/Supabase) | Only for app concerns (watchlists/prefs) — **not** market data |

> No market database. The only persistence we might add later is user-scoped app state
> (watchlists, saved screens), and that is explicitly post-v1.

---

## 5. PMXT Integration

### 5.1 Wire protocol
- Base: `https://api.pmxt.dev`. Auth: `Authorization: Bearer pmxt_live_...`.
- Venue pass-through shape: `POST /api/:exchange/:method` with `{ "args": [...] }`, response
  enveloped as `{ "success": true, "data": ... }`.
- We use the **`pmxtjs` Router** client rather than hand-rolling HTTP, so we get typed methods
  and the unified schema for free.
- **Router is read-only and needs only the PMXT API key** — no venue credentials required for
  search/matching/prices, which is exactly v1's scope.

### 5.2 Server-only data module
A single module wraps the Router; nothing else in the app imports `pmxtjs` directly.

```ts
// lib/pmxt/client.ts   (server-only)
import "server-only";
import pmxt from "pmxtjs";

export const router = new pmxt.Router({
  pmxtApiKey: process.env.PMXT_API_KEY!, // server secret, never exposed to client
});
```

### 5.3 Methods we rely on (v1)

| Product feature | PMXT Router method | Returns |
|---|---|---|
| Cross-venue market search | `fetchMarkets({ query, limit })` | `UnifiedMarket[]` |
| Cross-venue event search | `fetchEvents({ query, limit })` | `UnifiedEvent[]` (markets nested) |
| Screener of cross-venue opportunities | `fetchMatchedMarketClusters({ relation, minVenues, sort, limit })` | clusters w/ `confidence`, `markets[]` |
| Event-level clusters | `fetchMatchedEventClusters(...)` | event clusters |
| Side-by-side prices for one market | `compareMarketPrices({ marketId })` | per-venue `bestBid`/`bestAsk` + `relation`/`confidence`/`reasoning` |
| Narrower/broader markets | `fetchRelatedMarkets({ marketId })` | subset/superset markets w/ reasoning |

### 5.4 Unified schema (from PMXT)
We adopt PMXT's schema directly as our domain model — no remapping:
- **`UnifiedEvent`** → `eventId`, `title`, `category`, `tags`, `volume`, `volume24h`, `url`,
  `image`, `markets[]`.
- **`UnifiedMarket`** → `marketId`, `eventId`, `title`, `slug`, `description` (resolution
  criteria), `url`, `category`, `tags`, `volume`, `volume24h`, `liquidity`, `resolutionDate`,
  `status`, `outcomes[]`.
- **`UnifiedOutcome`** → `outcomeId`, `label`, `price` (0–1 for binary), `priceChange24h`.

`null` always means "venue has no value", never "fetch failed" — surface accordingly in UI.

---

## 6. Cross-Venue Matching & Gaps (the core risk — now handled by PMXT)

In v0.1 this was our biggest technical risk. PMXT solves it:
- Matching uses **embedding similarity + LLM-verified relation classification**, producing
  clusters with a `relation` (`identity` / `subset` / `superset` / ...), a `confidence`
  score (0–1), and human-readable `reasoning`.
- **False-arb protection:** we only present a clean cross-venue "gap" when the relation is
  `identity` and confidence is high (e.g. ≥ 0.9). Lower-confidence or `subset`/`superset`
  relations are shown with the relation label + `reasoning` so users understand the markets
  are related but not identical.
- Our job is **presentation and a confidence threshold policy**, not building a matcher.

> **Decision needed:** the identity-confidence threshold for showing a gap as an actionable
> arb vs. a "related, verify rules" badge. Default proposal: `identity` && `confidence ≥ 0.9`.

---

## 7. Caching & Freshness (Next.js 16 Cache Components)

Goal: minimize PMXT calls and keep the app fast, while keeping prices fresh enough to be
trustworthy. We use Next 16's `use cache` directive with explicit lifetimes and tags.

| Data | Cache strategy | Rationale |
|---|---|---|
| Search results | `use cache` + short `cacheLife` (e.g. ~30–60s), keyed by query | Searches repeat; catalog updates continuously |
| Matched clusters / screener feed | `use cache` + `cacheLife` ~minutes, `cacheTag('clusters')` | Cluster membership changes slowly |
| `compareMarketPrices` (comparison view) | very short TTL (~5–15s) or uncached | Prices drive arb credibility; must be fresh |
| Venue/category metadata | longer `cacheLife` (hours) | Rarely changes |

- Use `cacheTag(...)` + `revalidateTag`/`updateTag` for targeted invalidation.
- Always render a **freshness indicator** from the fetch time; visibly mark stale prices.
- **Decision needed:** confirm PMXT rate limits for our plan tier (docs:
  https://pmxt.dev/docs/rate-limits) and size `cacheLife` accordingly. Until confirmed, cache
  conservatively to avoid 429s.

---

## 8. App Surface

### 8.1 Server Components (initial render)
Data-heavy pages render on the server, calling the PMXT data module directly inside cached
functions — no client-side PMXT exposure, no API key leak.

### 8.2 Route Handlers (client-driven interactions)
Client filtering/search hits our own Next.js route handlers, which call PMXT server-side:

| Endpoint | Backed by | Purpose |
|---|---|---|
| `GET /api/search?q=&type=market\|event&limit=` | `fetchMarkets` / `fetchEvents` | Live search box |
| `GET /api/screener?relation=&minVenues=&sort=&limit=` | `fetchMatchedMarketClusters` | Screener feed |
| `GET /api/markets/:id/prices` | `compareMarketPrices` | Comparison view prices |
| `GET /api/markets/:id/related` | `fetchRelatedMarkets` | Narrower/broader markets |

Responses include a server timestamp for freshness display.

### 8.3 Key views
- **Search** — cross-venue search over markets/events; results link to canonical venue URLs.
- **Screener** — dense, sortable table of matched clusters; filter by relation, min venues,
  volume; sort by volume/confidence.
- **Comparison view** — per-venue bid/ask side by side for a market, gap highlighted **only**
  when identity+high-confidence; otherwise relation + reasoning shown. Includes resolution
  `description` and freshness.

---

## 9. Configuration & Secrets

- `PMXT_API_KEY` — server-side env var (Vercel project env), **never** `NEXT_PUBLIC_`.
- Optional `PMXT_API_BASE` override (defaults to `https://api.pmxt.dev`).
- No venue credentials in v1 (read-only Router).

---

## 10. Observability & Quality

- **PMXT health:** log Router call latency, error envelopes (`success:false` codes such as
  `AUTHENTICATION_ERROR`), and 429 rate-limit hits.
- **Data quality:** track per-cluster confidence distribution; sample identity clusters to
  validate gap correctness.
- **Product metrics (per PRD):** WAU/retention primary; coverage (venues/markets surfaced),
  arbs surfaced, click-throughs to venues.
- Graceful degradation: if PMXT is unavailable, serve last cached data with a stale banner.

---

## 11. Risks (updated)

| Risk | Mitigation |
|---|---|
| **Single-vendor dependency on PMXT** (uptime, pricing, coverage changes) | Isolate all PMXT access behind `lib/pmxt/*`; cache aggressively; monitor errors; the adapter boundary makes a future fallback feasible |
| **Rate limits / cost at scale** | Next 16 caching + Runtime Cache; confirm tier limits early |
| **False arbs from imperfect matching** | Gate gaps on `identity` + high confidence; always show relation + reasoning |
| **Price staleness** | Short/no cache on `compareMarketPrices`; freshness indicators |
| **Venue coverage gaps** | PMXT covers Polymarket, Kalshi, Limitless, Smarkets + more; verify the PRD's target venues are all present |

---

## 12. Open Decisions (summary)

1. **PMXT plan tier + exact rate limits** → sizes our caching TTLs (§7).
2. **Identity-confidence threshold** for showing an actionable gap (default `identity` &&
   `≥0.9`) (§6).
3. **Search granularity:** lead with event-level or market-level search as the default UX (§8).
4. **Caching lifetimes** per data type once rate limits are known (§7).
5. **Verify all PRD target venues** (Polymarket, Kalshi, Manifold, Limitless) are PMXT-supported
   — confirm Manifold specifically against PMXT's venue list.

---

## 13. Suggested Build Order

1. **Foundations:** Next.js 16 app + `lib/pmxt/client.ts` + env wiring; prove a server-side
   `fetchMarkets` call renders in an RSC.
2. **Search:** cross-venue search UI backed by `/api/search`, with `use cache`.
3. **Screener:** matched-cluster table via `fetchMatchedMarketClusters` with filters/sorting.
4. **Comparison view:** `compareMarketPrices` + `fetchRelatedMarkets`, gap highlighting gated
   on relation/confidence, freshness indicators.
5. **Polish:** caching tuning to rate limits, error/stale states, observability.
```
