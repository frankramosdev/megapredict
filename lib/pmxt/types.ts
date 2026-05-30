import "server-only";
import type {
  MarketOutcome,
  UnifiedMarket,
  UnifiedEvent,
  MatchedMarketCluster,
  PriceComparison,
  MatchResult,
  MatchRelation,
} from "pmxtjs";

/**
 * Serializable, client-safe DTOs. PMXT's SDK types use `Date` and class-based
 * arrays (`MarketList`); we map to plain JSON so values survive `use cache`
 * serialization and can cross the server→client boundary unchanged.
 */

export type Relation = MatchRelation;

export interface OutcomeDTO {
  outcomeId: string;
  label: string;
  price: number | null;
  priceChange24h: number | null;
}

export interface MarketDTO {
  marketId: string;
  eventId: string | null;
  title: string;
  slug: string | null;
  description: string | null;
  url: string | null;
  image: string | null;
  category: string | null;
  tags: string[] | null;
  venue: string | null;
  volume: number | null;
  volume24h: number | null;
  liquidity: number | null;
  resolutionDate: string | null;
  status: string | null;
  outcomes: OutcomeDTO[];
}

export interface EventDTO {
  eventId: string;
  title: string;
  slug: string | null;
  description: string | null;
  category: string | null;
  tags: string[] | null;
  url: string | null;
  image: string | null;
  venue: string | null;
  volume: number | null;
  volume24h: number | null;
  markets: MarketDTO[];
}

export interface ClusterMarketDTO extends MarketDTO {
  /** The cluster's canonical "Yes" probability for quick comparison, when available. */
  yesPrice: number | null;
}

export interface ClusterDTO {
  clusterId: string;
  canonicalTitle: string | null;
  category: string | null;
  relations: Relation[];
  confidence: number;
  volume24h: number;
  venues: string[];
  markets: ClusterMarketDTO[];
}

export interface PriceComparisonDTO {
  venue: string;
  marketId: string;
  marketTitle: string;
  url: string | null;
  relation: Relation;
  confidence: number;
  reasoning: string | null;
  bestBid: number | null;
  bestAsk: number | null;
  /** Mid-price derived from bid/ask, for at-a-glance comparison. */
  mid: number | null;
}

export interface RelatedMarketDTO {
  marketId: string;
  venue: string;
  title: string;
  url: string | null;
  relation: Relation;
  confidence: number;
  reasoning: string | null;
  bestBid: number | null;
  bestAsk: number | null;
}

/** A query result wrapped with the server-side fetch time for freshness display. */
export interface Fresh<T> {
  data: T;
  fetchedAt: number;
}

function num(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function str(value: string | null | undefined): string | null {
  return value != null && value !== "" ? value : null;
}

export function toOutcomeDTO(o: MarketOutcome): OutcomeDTO {
  return {
    outcomeId: o.outcomeId,
    label: o.label,
    price: num(o.price),
    priceChange24h: num(o.priceChange24h),
  };
}

export function toMarketDTO(m: UnifiedMarket): MarketDTO {
  return {
    marketId: m.marketId,
    eventId: str(m.eventId),
    title: m.title,
    slug: str(m.slug),
    description: str(m.description),
    url: str(m.url),
    image: str(m.image),
    category: str(m.category),
    tags: m.tags && m.tags.length ? m.tags : null,
    venue: str(m.sourceExchange),
    volume: num(m.volume),
    volume24h: num(m.volume24h),
    liquidity: num(m.liquidity),
    resolutionDate: m.resolutionDate ? new Date(m.resolutionDate).toISOString() : null,
    status: str(m.status),
    outcomes: (m.outcomes ?? []).map(toOutcomeDTO),
  };
}

export function toEventDTO(e: UnifiedEvent): EventDTO {
  return {
    eventId: e.id,
    title: e.title,
    slug: str(e.slug),
    description: str(e.description),
    category: str(e.category),
    tags: e.tags && e.tags.length ? e.tags : null,
    url: str(e.url),
    image: str(e.image),
    venue: str(e.sourceExchange),
    volume: num(e.volume),
    volume24h: num(e.volume24h),
    markets: Array.from(e.markets ?? []).map(toMarketDTO),
  };
}

function yesPriceOf(m: UnifiedMarket): number | null {
  if (m.yes) return num(m.yes.price);
  const yes = m.outcomes?.find((o) => o.label?.toLowerCase() === "yes");
  return yes ? num(yes.price) : (m.outcomes?.[0] ? num(m.outcomes[0].price) : null);
}

export function toClusterDTO(c: MatchedMarketCluster): ClusterDTO {
  const markets = (c.markets ?? []).map((m) => ({
    ...toMarketDTO(m),
    yesPrice: yesPriceOf(m),
  }));
  const venues = Array.from(
    new Set(markets.map((m) => m.venue).filter((v): v is string => Boolean(v))),
  );
  return {
    clusterId: c.clusterId,
    canonicalTitle: c.canonicalTitle,
    category: str(c.category),
    relations: c.relations ?? [],
    confidence: c.confidence,
    volume24h: c.volume24h ?? 0,
    venues,
    markets,
  };
}

export function toPriceComparisonDTO(p: PriceComparison): PriceComparisonDTO {
  const bestBid = num(p.bestBid);
  const bestAsk = num(p.bestAsk);
  const mid =
    bestBid != null && bestAsk != null ? (bestBid + bestAsk) / 2 : bestBid ?? bestAsk;
  return {
    venue: p.venue,
    marketId: p.market.marketId,
    marketTitle: p.market.title,
    url: str(p.market.url),
    relation: p.relation,
    confidence: p.confidence,
    reasoning: str(p.reasoning),
    bestBid,
    bestAsk,
    mid,
  };
}

export function toRelatedMarketDTO(r: MatchResult): RelatedMarketDTO {
  return {
    marketId: r.market.marketId,
    venue: str(r.market.sourceExchange) ?? r.relation,
    title: r.market.title,
    url: str(r.market.url),
    relation: r.relation,
    confidence: r.confidence,
    reasoning: str(r.reasoning),
    bestBid: num(r.bestBid),
    bestAsk: num(r.bestAsk),
  };
}
