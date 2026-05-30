import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16 Cache Components: enables the `use cache` directive,
  // cacheLife() and cacheTag() used across the PMXT data layer.
  cacheComponents: true,
  // Shared PMXT cache profiles — longer TTLs reduce api.pmxt.dev calls and
  // let stale-while-revalidate serve last-good data on transient fetch failures.
  cacheLife: {
    pmxtSearch: {
      stale: 300,
      revalidate: 600,
      expire: 3600,
    },
    pmxtScreener: {
      stale: 600,
      revalidate: 900,
      expire: 3600,
    },
    pmxtPrices: {
      stale: 30,
      revalidate: 60,
      expire: 300,
    },
    pmxtMarket: {
      stale: 300,
      revalidate: 600,
      expire: 3600,
    },
    pmxtRelated: {
      stale: 600,
      revalidate: 900,
      expire: 3600,
    },
  },
  // Keep the PMXT SDK out of the bundler. pmxt-core lazily require()s optional
  // per-venue trading SDKs (e.g. @opinion-labs/opinion-clob-sdk) that we don't
  // install — the read-only Router never loads them, but bundling tries to
  // resolve them statically and fails. Running them as external Node modules
  // defers those requires to runtime, where they stay dormant.
  serverExternalPackages: ["pmxtjs", "pmxt-core"],
  // PMXT serves venue-hosted market images from arbitrary domains.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  // Edge CDN cache for read-only PMXT proxy routes (pairs with lib/pmxt/respond).
  async headers() {
    return [
      {
        source: "/api/search",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=300, stale-while-revalidate=600",
          },
        ],
      },
      {
        source: "/api/screener",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=600, stale-while-revalidate=1200",
          },
        ],
      },
      {
        source: "/api/markets/:id/prices",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=30, stale-while-revalidate=60",
          },
        ],
      },
      {
        source: "/api/markets/:id/related",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=600, stale-while-revalidate=1200",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
