# megapredict

A read-only, cross-venue aggregator and screener for prediction markets. It groups
equivalent questions from many venues into one view so users can search, compare prices,
and spot cross-venue gaps. All market data comes from the PMXT API.

## Language

**Cluster**:
A single real-world question grouped across venues (PMXT's matched market/event cluster).
The primary unit users search, screen, and land on. Individual venue markets are nested one
level down.
_Avoid_: dedup group, matched group

**Market**:
One venue's listing of a question (PMXT `UnifiedMarket`), nested inside a cluster. Not the
primary unit — exposed one level below the cluster.
_Avoid_: listing, contract

**Event**:
PMXT's higher-level grouping that can contain multiple related markets. Used as a search
result type, distinct from a cluster.

**Gap**:
The capturable top-of-book spread for the YES outcome across the real-money venues in an
identity-matched cluster: `highest bestBid − lowest bestAsk`. Shown with both legs explicit
("Buy YES @ X on venue A · Sell YES @ Y on venue B"). Gross of fees and depth (size-1,
top-of-book), always labeled as such — never net profit. Requires a live two-sided book on
both legs; venues with only a last/reference price are shown for context, not as a leg.
Play-money venues are excluded entirely.
_Avoid_: arb, edge, profit (these imply a fee-adjusted, capturable figure we do not compute)

**Gaps feed**:
The default landing view: clusters ranked by gap, restricted to identity-matched,
high-confidence, real-money, binary (two-outcome) clusters. Multi-outcome clusters are
searchable and viewable in the comparison view but not ranked here. The product's headline
view and retention hook.

**Play-money venue**:
A venue whose prices are denominated in non-redeemable play currency (e.g. Manifold's mana).
Searchable and shown for context/sentiment, but excluded from gaps and the gaps feed, and
badged "play money — not a tradable gap".
_Avoid_: fake-money venue, demo venue

**Anonymous user**:
A frictionless, no-signup identity created on first visit via Better-auth's anonymous
plugin. Owns the user's watchlist server-side. Can later be upgraded to a real account
(by adding an email) without losing state — the on-ramp to alerts.
_Avoid_: guest, session

**Watchlist**:
The set of clusters an authenticated (incl. anonymous) user has starred, persisted
server-side and keyed to their user. The v1 retention surface.

**Alert**:
An opt-in notification fired when a watched cluster's gap crosses a user-set threshold.
Deferred to v1.5; requires the user to provide an email (upgrading the anonymous account).
