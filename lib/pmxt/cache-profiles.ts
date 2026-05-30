/**
 * Named cache profiles for PMXT data. Defined in next.config.ts so TTLs stay
 * in one place and match Vercel CDN headers on /api/* routes.
 */
export const PMXT_CACHE_PROFILE = {
  search: "pmxtSearch",
  screener: "pmxtScreener",
  prices: "pmxtPrices",
  market: "pmxtMarket",
  related: "pmxtRelated",
} as const;

/** s-maxage for route handlers — mirrors the Next cache profile stale window. */
export const PMXT_API_SMAXAGE = {
  search: 300,
  screener: 600,
  prices: 30,
  market: 300,
  related: 600,
} as const;
