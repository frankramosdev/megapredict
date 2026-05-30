import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getRouter } from "./client";
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

/** Cross-venue market search. Short TTL — the catalog updates continuously. */
export async function searchMarkets(
  query: string,
  limit = 24,
): Promise<Fresh<MarketDTO[]>> {
  "use cache";
  cacheLife({ stale: 30, revalidate: 45, expire: 120 });
  cacheTag("search", `search:markets:${query}`);

  const router = getRouter();
  const markets = await router.fetchMarkets({
    query: query || undefined,
    limit: clampLimit(limit, 24),
  });
  return { data: markets.map(toMarketDTO), fetchedAt: Date.now() };
}

/** Cross-venue event search (markets nested per event). */
export async function searchEvents(
  query: string,
  limit = 18,
): Promise<Fresh<EventDTO[]>> {
  "use cache";
  cacheLife({ stale: 30, revalidate: 45, expire: 120 });
  cacheTag("search", `search:events:${query}`);

  const router = getRouter();
  const events = await router.fetchEvents({
    query: query || undefined,
    limit: clampLimit(limit, 18),
  });
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

/** Matched-cluster screener feed. Cluster membership changes slowly → minutes. */
export async function fetchScreener(
  params: ScreenerParams,
): Promise<Fresh<ClusterDTO[]>> {
  "use cache";
  cacheLife({ stale: 120, revalidate: 180, expire: 600 });
  cacheTag("clusters");

  const router = getRouter();
  const clusters = await router.fetchMatchedMarketClusters({
    relation: params.relation,
    minVenues: params.minVenues ?? 2,
    minConfidence: params.minConfidence,
    sort: params.sort ?? "volume",
    query: params.query || undefined,
    limit: clampLimit(params.limit, 50),
  });
  return { data: clusters.map(toClusterDTO), fetchedAt: Date.now() };
}

/**
 * Side-by-side venue prices for one market. Very short TTL — prices drive arb
 * credibility, so freshness matters most here (TECHNICAL_DESIGN §7).
 */
export async function fetchMarketPrices(
  marketId: string,
): Promise<Fresh<PriceComparisonDTO[]>> {
  "use cache";
  cacheLife({ stale: 10, revalidate: 10, expire: 30 });
  cacheTag("prices", `prices:${marketId}`);

  const router = getRouter();
  const prices = await router.compareMarketPrices({ marketId });
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
  "use cache";
  cacheLife({ stale: 120, revalidate: 180, expire: 600 });
  cacheTag("related", `related:${marketId}`);

  const router = getRouter();
  const matches = await router.fetchMarketMatches({ marketId, includePrices: true });
  const related = matches
    .filter((m) => m.relation === "subset" || m.relation === "superset")
    .map(toRelatedMarketDTO);
  return { data: related, fetchedAt: Date.now() };
}

/** Single market lookup (for the comparison page header). */
export async function fetchMarket(marketId: string): Promise<Fresh<MarketDTO | null>> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 90, expire: 300 });
  cacheTag("market", `market:${marketId}`);

  const router = getRouter();
  try {
    const market = await router.fetchMarket({ marketId });
    return { data: market ? toMarketDTO(market) : null, fetchedAt: Date.now() };
  } catch {
    return { data: null, fetchedAt: Date.now() };
  }
}
