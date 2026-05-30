import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { MarketHeader } from "@/components/market-header";
import { PriceComparison } from "@/components/price-comparison";
import { RelatedMarkets } from "@/components/related-markets";
import { fetchMarket } from "@/lib/pmxt/queries";
import { isPmxtConfigured } from "@/lib/pmxt/client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!isPmxtConfigured()) return { title: "Market comparison" };
  try {
    const { data: market } = await fetchMarket(decodeURIComponent(id));
    if (market) {
      return {
        title: market.title,
        description: `Compare ${market.title} prices across venues.`,
      };
    }
  } catch {
    // fall through to default
  }
  return { title: "Market comparison" };
}

function HeaderSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-4 w-24 rounded bg-surface" />
      <div className="h-7 w-2/3 rounded bg-surface" />
      <div className="h-4 w-1/2 rounded bg-surface" />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="h-48 animate-pulse rounded-xl border border-border bg-surface" />
  );
}

// Each wrapper reads the dynamic route `params` inside its own Suspense
// boundary, as required by Next 16 Cache Components.
async function HeaderSection({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MarketHeader marketId={decodeURIComponent(id)} />;
}

async function PricesSection({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PriceComparison marketId={decodeURIComponent(id)} />;
}

async function RelatedSection({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RelatedMarkets marketId={decodeURIComponent(id)} />;
}

export default function MarketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="space-y-8">
      <Link
        href="/screener"
        className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink"
      >
        ← Back to screener
      </Link>

      <Suspense fallback={<HeaderSkeleton />}>
        <HeaderSection params={params} />
      </Suspense>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-ink-muted">Cross-venue prices</h2>
        <Suspense fallback={<TableSkeleton />}>
          <PricesSection params={params} />
        </Suspense>
      </section>

      <Suspense fallback={null}>
        <RelatedSection params={params} />
      </Suspense>
    </div>
  );
}
