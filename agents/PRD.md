# megapredict — Product Requirements Document

**Status:** Draft v0.1
**Last updated:** 2026-05-29
**Owner:** TBD

---

## 1. Problem & Context (the "why")

Prediction markets are having a breakout moment. Volume exploded through the 2024–2025
election cycle and kept growing, and the space has fragmented across many venues —
Polymarket, Kalshi, Manifold, Limitless, and a long tail of onchain and offchain books.

That fragmentation creates three real, present-day pain points:

1. **Discovery is broken.** The "same" question (e.g. *Will X happen by Y date?*) is listed
   on multiple venues with different wording, resolution rules, and liquidity. There is no
   single place to search across all of them.
2. **Persistent price gaps go unexploited.** The same event frequently trades at materially
   different odds across venues. These gaps are real money left on the table, but spotting
   them today requires manually tabbing between sites.
3. **No serious unified screener exists.** Traders and researchers have nothing equivalent
   to a stock screener (Finviz/TradingView) for prediction markets — no unified data model,
   no cross-venue comparison, no screening on liquidity, spread, volume, or edge.

### Why now
- **Growth:** Prediction markets are scaling fast post-election; mindshare and capital are
  flowing in, and the user base is broadening beyond crypto-natives.
- **Arbitrage reality:** Cross-venue price discrepancies are persistent and observable today —
  there is a concrete, demonstrable value to surfacing them.
- **White space:** No high-quality unified aggregator/screener has captured this yet. The
  window to become the default "search layer" for prediction markets is open now.

---

## 2. Target Users

v1 is a broad, read-only consumer tool serving three overlapping personas:

| Persona | What they want | Primary value |
|---|---|---|
| **Active traders / arbitrageurs** | Find cross-venue price gaps fast | Edge detection, spread/liquidity comparison |
| **Researchers / analysts** | Screen sentiment & odds across venues | Unified data, filtering, market discovery |
| **Casual bettors** | One place to find & compare markets | Search, dedup, "where's the best price" |

The unifying need across all three: **one place to search, compare, and screen every major
prediction market.**

---

## 3. Goals & Success Metrics

### v1 success is defined by:
- **Primary metric: Weekly Active Users (WAU) and week-over-week retention.** If people come
  back weekly, the tool is genuinely useful.

### Supporting / health metrics (tracked, not the bar):
- Market coverage breadth and data freshness per venue.
- Number of cross-venue matched markets (dedup quality).
- Number of actionable price gaps surfaced.
- Search-to-venue click-throughs.

### Non-goals for v1 (explicitly out of scope)
- **No trading / execution.** v1 is read-only. No order placement, no wallet/custody, no
  venue-side auth. (Deferred to a later phase.)
- No portfolio tracking or P&L.
- No social / commenting features.
- No native mobile app (responsive web only).
- No automated arbitrage execution or bots.

---

## 4. Scope — v1 (Read-only Aggregator + Screener)

### 4.1 Core capabilities
1. **Unified ingestion** of markets from supported venues into a single normalized data model.
2. **Cross-venue search** — full-text search across all markets, returning matches regardless
   of venue or wording.
3. **Market dedup / matching** — group equivalent markets across venues into a single
   canonical view (best-effort with confidence scoring).
4. **Unified screener** — filter and sort across the full market universe by attributes
   (venue, category, liquidity, volume, spread, price, resolution date, cross-venue gap).
5. **Cross-venue comparison view** — for a matched event, show each venue's price, liquidity,
   spread, and resolution terms side by side, highlighting the gap.

### 4.2 Data source
- **All market data comes from the [PMXT API](https://www.pmxt.dev/docs)** (Router, read-only).
  PMXT provides the unified schema, cross-venue search, market/event matching with confidence
  scores, and price comparison — so megapredict does not build its own ingestion, normalization,
  or matching. See `agents/TECHNICAL_DESIGN.md`.
- **Frontend:** Next.js 16 (latest).

### 4.3 Supported venues (v1)
- **Must have:** Polymarket, Kalshi, Manifold, Limitless (whichever PMXT supports — verify
  Manifold against PMXT's venue list).
- **Stretch / tail:** any additional venues PMXT covers (Smarkets, etc.), available for free
  since they share the same unified schema.

### 4.3 Normalized data model (minimum fields)
Each market record should normalize at least:
- Venue, venue market ID, deep link
- Question / title (raw + normalized)
- Category / tags
- Outcome(s) and current price/odds per outcome
- Liquidity, 24h volume, bid/ask spread
- Resolution date and resolution source/rules (raw text)
- Status (open / closed / resolved)
- Last-updated timestamp (data freshness)

---

## 5. Key Decisions Still Open

These need answers before/while building and should be resolved by the owner. (Data
acquisition, dedup/matching, and resolution-rule equivalence are now handled by PMXT and are no
longer open.)

- **PMXT plan tier & rate limits:** which tier, and how its limits constrain our caching/refresh
  strategy.
- **Refresh cadence / caching TTLs:** how fresh prices must be for arb credibility vs. staying
  within PMXT rate limits (tuned via Next.js 16 caching).
- **Confidence threshold:** at what PMXT relation/confidence do we present a cross-venue "gap"
  as actionable vs. "related, verify rules"? (proposed default: `identity` && confidence ≥ 0.9).
- **Monetization (post-v1):** affiliate/referral click-throughs, pro screener tier, or API.

---

## 6. Rough Phasing

| Phase | Outcome |
|---|---|
| **0 — Foundations** | Normalized data model + ingestion for 1 venue (Polymarket), basic search. |
| **1 — Multi-venue** | All 4 launch venues ingested; cross-venue search live. |
| **2 — Screener** | Filtering/sorting across the universe; data freshness indicators. |
| **3 — Matching** | Dedup/matching + side-by-side comparison view with gap highlighting. |
| **Later** | Alerts on price moves/arbs; trading/execution; mobile. |

---

## 7. Open Risks

- **Single-vendor dependency on PMXT:** uptime, pricing, coverage, and rate limits are now
  outside our control. Mitigation: isolate all PMXT access behind one module, cache
  aggressively, monitor errors. This is the new top risk (replacing self-built matching).
- **False arbs:** mitigated by PMXT's relation typing + confidence — only present gaps when
  `identity` and high confidence; otherwise show relation + reasoning.
- **Freshness vs. cost/rate-limits:** stale prices kill the value prop; balance via Next.js 16
  caching tuned to PMXT limits.
- **Crowded timing:** white space won't last — building on PMXT means we can reach a credible
  v1 much faster, which is now our main advantage.
