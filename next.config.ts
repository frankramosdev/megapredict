import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16 Cache Components: enables the `use cache` directive,
  // cacheLife() and cacheTag() used across the PMXT data layer.
  cacheComponents: true,
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
};

export default nextConfig;
