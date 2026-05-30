/**
 * Standalone PMXT integration check.
 *
 * Proves the `pmxtjs` Router + your API key can reach the live catalog and that
 * `fetchMarkets` returns the unified schema megapredict renders.
 *
 * Usage:
 *   PMXT_API_KEY=pmxt_live_xxx node scripts/validate-pmxt.mjs [query]
 */
import pmxt from "pmxtjs";

const apiKey = process.env.PMXT_API_KEY;
if (!apiKey) {
  console.error("✗ PMXT_API_KEY is not set. See .env.example.");
  process.exit(1);
}

const query = process.argv[2] ?? "election";

const router = new pmxt.Router({
  pmxtApiKey: apiKey,
  ...(process.env.PMXT_API_BASE ? { baseUrl: process.env.PMXT_API_BASE } : {}),
});

try {
  const start = Date.now();
  const markets = await router.fetchMarkets({ query, limit: 5 });
  const ms = Date.now() - start;

  console.log(`✓ fetchMarkets("${query}") → ${markets.length} markets in ${ms}ms\n`);

  for (const m of markets) {
    const top = (m.outcomes ?? [])
      .slice(0, 2)
      .map((o) => `${o.label} ${(o.price * 100).toFixed(0)}%`)
      .join(" · ");
    const venue = m.sourceExchange ?? "?";
    console.log(`  [${venue}] ${m.title}`);
    console.log(`     ${top || "no outcomes"}  ·  vol24h $${Math.round(m.volume24h ?? 0).toLocaleString()}`);
  }

  console.log("\n✓ PMXT integration is working.");
  process.exit(0);
} catch (err) {
  console.error("\n✗ PMXT request failed:", err?.message ?? err);
  process.exit(1);
}
