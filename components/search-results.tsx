import { searchMarkets } from "@/lib/pmxt/queries";
import { isPmxtConfigured, PmxtConfigError } from "@/lib/pmxt/client";
// MarketCard is no longer rendered here — the MatchedMarkets widget replaces the
// hand-rolled grid. Kept (commented out) alongside the old grid for reference.
// import { MarketCard } from "./market-card";
import { Freshness } from "./freshness";
import { ErrorState, NoResults, SetupHint } from "./states";
import { MatchedMarketsWidget } from "./matched-markets-widget";

/**
 * Async Server Component. Calls the cached `searchMarkets` query server-side
 * (the PMXT key never reaches the client) and renders the result grid. Errors
 * are caught here so a transient PMXT failure degrades gracefully instead of
 * blowing up the whole route.
 */
export async function SearchResults({ q }: { q: string }) {
  if (!isPmxtConfigured()) {
    return <SetupHint />;
  }

  try {
    const { data: markets, fetchedAt } = await searchMarkets(q, 24);

    if (markets.length === 0) {
      return <NoResults query={q || undefined} />;
    }

    return (
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-ink-muted">
            {q ? (
              <>
                <span className="text-ink">{markets.length}</span> markets for “
                <span className="text-ink">{q}</span>”
              </>
            ) : (
              "Trending markets across all venues"
            )}
          </h2>
          <Freshness fetchedAt={fetchedAt} staleAfter={300_000} />
        </div>
        {/* Old hand-rolled MarketCard grid — replaced by the PMXT MatchedMarkets
            widget below (PMXT's signature cross-venue, spread-highlighted view).
            Kept (commented out) for reference.
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {markets.map((m) => (
            <MarketCard key={m.marketId} market={m} />
          ))}
        </div>
        */}
        <MatchedMarketsWidget limit={12} />
      </section>
    );
  } catch (err) {
    if (err instanceof PmxtConfigError) return <SetupHint />;
    return <ErrorState message={err instanceof Error ? err.message : undefined} />;
  }
}
