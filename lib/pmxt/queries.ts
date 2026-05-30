import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getRouter } from "./client";
import { PMXT_CACHE_PROFILE } from "./cache-profiles";
import { withPmxtRetry } from "./retry";
import {
  toMarketDTO,
  toEventDTO,
  toClusterDTO,
  toPriceComparisonDTO,
  toRelatedMarketDTO,
  type Fresh,
  type MarketDTO,
  type EventDTO,
  type ClusterDTO,
  type PriceComparisonDTO,
  type RelatedMarketDTO,
  type Relation,
} from "./types";

export {
  ACTIONABLE_RELATION,
  ACTIONABLE_CONFIDENCE,
  isActionableGap,
} from "./policy";

function clampLimit(limit: number | undefined, fallback: number, max = 100): number {
  if (!limit || Number.isNaN(limit)) return fallback;
  return Math.max(1, Math.min(Math.floor(limit), max));
}

/** Cross-venue market search. Cached remotely so all Vercel instances share entries. */
export async function searchMarkets(
  query: string,
  limit = 24,
): Promise<Fresh<MarketDTO[]>> {
  "use cache: remote";
  cacheLife(PMXT_CACHE_PROFILE.search);
  cacheTag("search", `search:markets:${query}`, `search:markets:limit:${limit}`);

  const router = getRouter();
  const markets = await withPmxtRetry(() =>
    router.fetchMarkets({
      query: query || undefined,
      limit: clampLimit(limit, 24),
    }),
  );
  return { data: markets.map(toMarketDTO), fetchedAt: Date.now() };
}

/** Cross-venue event search (markets nested per event). */
export async function searchEvents(
  query: string,
  limit = 18,
): Promise<Fresh<EventDTO[]>> {
  "use cache: remote";
  cacheLife(PMXT_CACHE_PROFILE.search);
  cacheTag("search", `search:events:${query}`, `search:events:limit:${limit}`);

  const router = getRouter();
  const events = await withPmxtRetry(() =>
    router.fetchEvents({
      query: query || undefined,
      limit: clampLimit(limit, 18),
    }),
  );
  return { data: events.map(toEventDTO), fetchedAt: Date.now() };
}

export interface ScreenerParams {
  relation?: Relation;
  minVenues?: number;
  minConfidence?: number;
  sort?: "volume" | "confidence";
  query?: string;
  limit?: number;
}

function screenerCacheKey(params: ScreenerParams): string {
  return [
    params.relation ?? "any",
    params.minVenues ?? 2,
    params.minConfidence ?? "none",
    params.sort ?? "volume",
    params.query ?? "",
    params.limit ?? 50,
  ].join(":");
}

/** Matched-cluster screener feed. Cluster membership changes slowly → minutes. */
export async function fetchScreener(
  params: ScreenerParams,
): Promise<Fresh<ClusterDTO[]>> {
  "use cache: remote";
  cacheLife(PMXT_CACHE_PROFILE.screener);
  cacheTag("clusters", `clusters:${screenerCacheKey(params)}`);

  const router = getRouter();
  const clusters = await withPmxtRetry(() =>
    router.fetchMatchedMarketClusters({
      relation: params.relation,
      minVenues: params.minVenues ?? 2,
      minConfidence: params.minConfidence,
      sort: params.sort ?? "volume",
      query: params.query || undefined,
      limit: clampLimit(params.limit, 50),
    }),
  );
  return { data: clusters.map(toClusterDTO), fetchedAt: Date.now() };
}

/**
 * Side-by-side venue prices for one market. Shorter TTL — prices drive arb
 * credibility, so freshness matters most here (TECHNICAL_DESIGN §7).
 */
export async function fetchMarketPrices(
  marketId: string,
): Promise<Fresh<PriceComparisonDTO[]>> {
  "use cache: remote";
  cacheLife(PMXT_CACHE_PROFILE.prices);
  cacheTag("prices", `prices:${marketId}`);

  const router = getRouter();
  const prices = await withPmxtRetry(() =>
    router.compareMarketPrices({ marketId }),
  );
  return { data: prices.map(toPriceComparisonDTO), fetchedAt: Date.now() };
}

/**
 * Narrower/broader markets related to a given market. The Router exposes this
 * via `fetchMarketMatches`; we keep only `subset`/`superset` edges (the same
 * set the docs' `fetchRelatedMarkets` helper surfaces) so the comparison page
 * can show "this market is narrower/broader than" relationships.
 */
export async function fetchRelated(
  marketId: string,
): Promise<Fresh<RelatedMarketDTO[]>> {
  "use cache: remote";
  cacheLife(PMXT_CACHE_PROFILE.related);
  cacheTag("related", `related:${marketId}`);

  const router = getRouter();
  const matches = await withPmxtRetry(() =>
    router.fetchMarketMatches({ marketId, includePrices: true }),
  );
  const related = matches
    .filter((m) => m.relation === "subset" || m.relation === "superset")
    .map(toRelatedMarketDTO);
  return { data: related, fetchedAt: Date.now() };
}

/** Single market lookup (for the comparison page header). */
export async function fetchMarket(marketId: string): Promise<Fresh<MarketDTO | null>> {
  "use cache: remote";
  cacheLife(PMXT_CACHE_PROFILE.market);
  cacheTag("market", `market:${marketId}`);

  const router = getRouter();
  try {
    const market = await withPmxtRetry(() => router.fetchMarket({ marketId }));
    return { data: market ? toMarketDTO(market) : null, fetchedAt: Date.now() };
  } catch {
    return { data: null, fetchedAt: Date.now() };
  }
}
