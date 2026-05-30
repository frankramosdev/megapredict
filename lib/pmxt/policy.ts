import type { ClusterDTO, Relation } from "./types";

/**
 * Gap policy (PRD §5, TECHNICAL_DESIGN §6). Client-safe (no server-only import)
 * so badges and tables can share the exact same threshold the server uses.
 *
 * Only present a cross-venue price difference as an actionable arbitrage when
 * the relation is `identity` and confidence clears this bar. Everything else is
 * "related — verify rules".
 */
export const ACTIONABLE_RELATION: Relation = "identity";
export const ACTIONABLE_CONFIDENCE = 0.9;

export function isActionableGap(relation: Relation, confidence: number): boolean {
  return relation === ACTIONABLE_RELATION && confidence >= ACTIONABLE_CONFIDENCE;
}

export function clusterIsActionable(cluster: {
  relations: Relation[];
  confidence: number;
}): boolean {
  return (
    cluster.relations.includes(ACTIONABLE_RELATION) &&
    cluster.confidence >= ACTIONABLE_CONFIDENCE
  );
}

export interface GapStat {
  min: number | null;
  max: number | null;
  /** Spread in 0–1 probability units (max − min). */
  spread: number | null;
}

/** Min/max/spread of the canonical "Yes" probability across a cluster's venues. */
export function clusterGap(cluster: ClusterDTO): GapStat {
  const prices = cluster.markets
    .map((m) => m.yesPrice)
    .filter((p): p is number => p != null && Number.isFinite(p));
  if (prices.length < 2) return { min: prices[0] ?? null, max: prices[0] ?? null, spread: null };
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return { min, max, spread: max - min };
}

/** Highest-volume market in a cluster — the best anchor for the comparison view. */
export function clusterAnchorMarketId(cluster: ClusterDTO): string | null {
  if (cluster.markets.length === 0) return null;
  return [...cluster.markets].sort(
    (a, b) => (b.volume24h ?? 0) - (a.volume24h ?? 0),
  )[0].marketId;
}
