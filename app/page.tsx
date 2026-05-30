import { Suspense } from "react";
import Link from "next/link";
import { SearchBox } from "@/components/search-box";
import { SearchResults } from "@/components/search-results";
import { MarketCardSkeleton } from "@/components/market-card";

function SearchBoxFallback() {
  return (
    <div className="h-[52px] w-full rounded-xl border border-border bg-surface" />
  );
}

function ResultsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <MarketCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Reads `searchParams` (a dynamic request input) inside the Suspense boundary,
 * as required by Next 16 Cache Components, then renders the cached results.
 */
async function Results({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  return <SearchResults q={q.trim()} />;
}

export default function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  return (
    <div className="space-y-8">
      <section className="mx-auto max-w-3xl pt-4 text-center">
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          One search for every prediction market.
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-pretty text-sm text-ink-muted sm:text-base">
          Polymarket, Kalshi, Limitless, and more — unified. Find the same question
          across venues, compare odds, and spot price gaps.
        </p>
        <div className="mx-auto mt-6 max-w-2xl">
          <Suspense fallback={<SearchBoxFallback />}>
            <SearchBox autoFocus />
          </Suspense>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-ink-faint">
          <span>Try:</span>
          {["election", "Bitcoin", "Fed rate cut", "Super Bowl"].map((s) => (
            <Link
              key={s}
              href={`/?q=${encodeURIComponent(s)}`}
              className="rounded-full border border-border px-2.5 py-0.5 transition-colors hover:border-border-strong hover:text-ink-muted"
            >
              {s}
            </Link>
          ))}
        </div>
      </section>

      <Suspense fallback={<ResultsSkeleton />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
