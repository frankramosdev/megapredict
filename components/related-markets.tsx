import Link from "next/link";
import { fetchRelated } from "@/lib/pmxt/queries";
import { isPmxtConfigured } from "@/lib/pmxt/client";
import { VenueBadge, RelationBadge } from "./badges";
import { formatCents } from "@/lib/format";

/**
 * Narrower/broader markets (subset/superset). Rendered in its own Suspense
 * boundary so it streams independently of the price table. Failures here are
 * non-critical, so we simply render nothing rather than an error block.
 */
export async function RelatedMarkets({ marketId }: { marketId: string }) {
  if (!isPmxtConfigured()) return null;

  let related;
  try {
    const result = await fetchRelated(marketId);
    related = result.data;
  } catch {
    return null;
  }

  if (!related || related.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-ink-muted">
        Related markets (narrower / broader)
      </h2>
      <ul className="space-y-2">
        {related.map((r) => (
          <li
            key={`${r.venue}-${r.marketId}`}
            className="rounded-lg border border-border bg-surface p-3"
          >
            <div className="flex items-center gap-2">
              <RelationBadge relation={r.relation} confidence={r.confidence} />
              <VenueBadge venue={r.venue} />
              {r.bestBid != null || r.bestAsk != null ? (
                <span className="ml-auto tabular text-xs text-ink-muted">
                  {formatCents(r.bestBid)} / {formatCents(r.bestAsk)}
                </span>
              ) : null}
            </div>
            <Link
              href={`/markets/${encodeURIComponent(r.marketId)}`}
              className="mt-1.5 block text-sm text-ink hover:text-brand"
            >
              {r.title}
            </Link>
            {r.reasoning ? (
              <p className="mt-1 text-xs text-ink-faint">{r.reasoning}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
