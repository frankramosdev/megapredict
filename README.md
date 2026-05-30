# megapredict

The prediction-market screener. One search across every major venue —
Polymarket, Kalshi, Limitless, and more — with cross-venue odds comparison and
honest price-gap detection.

All market data comes from the [PMXT Router](https://www.pmxt.dev/docs) (read-only).
megapredict builds no ingestion, normalization, or matching of its own — it's a
thin Next.js 16 app that renders PMXT's unified schema.

## Stack

- **Next.js 16** (App Router, Turbopack, **Cache Components** / `use cache`)
- **TypeScript**, **React 19**
- **Tailwind CSS v4**
- **`pmxtjs`** — the sole data source, accessed server-side only

## Getting started

```bash
npm install
cp .env.example .env        # then add your PMXT key
npm run dev                 # http://localhost:3000
```

Get a key at [pmxt.dev/dashboard](https://pmxt.dev/dashboard) (starts with
`pmxt_live_`) and set it in `.env`:

```
PMXT_API_KEY=pmxt_live_xxxxxxxxxxxxxxxxxxxxxxxx
```

The key is **server-side only** and is never exposed to the browser. Without it,
the app renders a setup hint instead of crashing.

### Validate the PMXT integration

```bash
PMXT_API_KEY=pmxt_live_xxx npm run validate:pmxt -- "election"
```

This calls `router.fetchMarkets(...)` directly and prints unified-schema rows.
The home page renders the same `fetchMarkets` call as a Server Component.

## Architecture

```
app/                         Routes (Server Components + route handlers)
  page.tsx                   Search landing — renders fetchMarkets (RSC)
  screener/page.tsx          Matched-cluster screener table
  markets/[id]/page.tsx      Cross-venue comparison view
  api/                       Client-driven route handlers (search/screener/prices/related)
components/                  Presentational + a few client islands
lib/pmxt/
  client.ts                  Server-only Router (the single PMXT chokepoint)
  queries.ts                 Cached query functions (`use cache` + cacheLife/cacheTag)
  types.ts                   Serializable DTOs + mappers from the unified schema
  policy.ts                  Gap policy (identity + confidence ≥ 0.9 = actionable)
lib/format.ts                Number / probability / freshness formatting
```

**Caching** (tuned to balance freshness vs. PMXT rate limits):

| Data | TTL | Why |
|---|---|---|
| Search results | ~30–45s | Catalog updates continuously |
| Matched clusters | ~2–3 min | Cluster membership changes slowly |
| `compareMarketPrices` | ~10s | Prices drive arb credibility — keep fresh |

**False-arb protection:** a cross-venue gap is only shown as *actionable* when the
relation is `identity` and confidence ≥ 90%. Everything else is labelled
"related — verify rules" with PMXT's reasoning.

## Scripts

- `npm run dev` — dev server
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run typecheck` — `tsc --noEmit`
- `npm run validate:pmxt` — live PMXT integration check
