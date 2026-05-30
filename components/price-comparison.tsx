import { fetchMarketPrices, fetchMarket } from "@/lib/pmxt/queries";
import { isPmxtConfigured, PmxtConfigError } from "@/lib/pmxt/client";
import { isActionableGap, ACTIONABLE_CONFIDENCE } from "@/lib/pmxt/policy";
import type { MarketDTO, PriceComparisonDTO } from "@/lib/pmxt/types";
import { VenueBadge, RelationBadge } from "./badges";
import { Freshness } from "./freshness";
import { ErrorState, MessageState, SetupHint } from "./states";
import { formatCents, formatChange, formatUsd } from "@/lib/format";

interface Edge {
  spread: number;
  buyVenue: string;
  buyAsk: number;
  sellVenue: string;
  sellBid: number;
  actionable: boolean;
}

/** Best cross-venue edge: buy at the lowest ask, sell at the highest bid. */
function computeEdge(rows: PriceComparisonDTO[]): Edge | null {
  const asks = rows.filter((r) => r.bestAsk != null);
  const bids = rows.filter((r) => r.bestBid != null);
  if (asks.length === 0 || bids.length === 0) return null;

  const bestAsk = asks.reduce((a, b) => (b.bestAsk! < a.bestAsk! ? b : a));
  const bestBid = bids.reduce((a, b) => (b.bestBid! > a.bestBid! ? b : a));
  if (bestAsk.venue === bestBid.venue) return null;

  const spread = bestBid.bestBid! - bestAsk.bestAsk!;
  const actionable =
    isActionableGap(bestAsk.relation, bestAsk.confidence) &&
    isActionableGap(bestBid.relation, bestBid.confidence);

  return {
    spread,
    buyVenue: bestAsk.venue,
    buyAsk: bestAsk.bestAsk!,
    sellVenue: bestBid.venue,
    sellBid: bestBid.bestBid!,
    actionable,
  };
}

function EdgeBanner({ edge }: { edge: Edge }) {
  const pts = (edge.spread * 100).toFixed(1);
  const positive = edge.spread > 0;

  if (!positive) {
    return (
      <div className="rounded-xl border border-border bg-surface p-4 text-sm text-ink-muted">
        No positive cross-venue edge right now — best ask ≥ best bid across venues.
      </div>
    );
  }

  if (edge.actionable) {
    return (
      <div className="rounded-xl border border-positive/40 bg-positive/10 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-positive">
          Actionable gap · {pts} pts
        </div>
        <p className="mt-1 text-sm text-ink-muted">
          Buy “Yes” on <span className="font-medium text-ink">{edge.buyVenue}</span> at{" "}
          {formatCents(edge.buyAsk)}, sell on{" "}
          <span className="font-medium text-ink">{edge.sellVenue}</span> at{" "}
          {formatCents(edge.sellBid)}. Same question at ≥
          {Math.round(ACTIONABLE_CONFIDENCE * 100)}% match confidence.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-warning/30 bg-warning/10 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-warning">
        Potential gap · {pts} pts — verify rules
      </div>
      <p className="mt-1 text-sm text-ink-muted">
        Prices differ across venues, but the match isn&apos;t a high-confidence{" "}
        <code className="text-ink">identity</code>. Confirm the resolution criteria line up
        before treating this as an arb.
      </p>
    </div>
  );
}

function PriceRow({
  row,
  isBestBid,
  isBestAsk,
}: {
  row: PriceComparisonDTO;
  isBestBid: boolean;
  isBestAsk: boolean;
}) {
  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-3 pl-4 pr-3">
        <div className="flex items-center gap-2">
          <VenueBadge venue={row.venue} />
          {row.url ? (
            <a
              href={row.url}
              target="_blank"
              rel="noreferrer"
              className="line-clamp-1 max-w-[260px] text-xs text-ink-muted hover:text-brand"
            >
              {row.marketTitle} ↗
            </a>
          ) : (
            <span className="line-clamp-1 max-w-[260px] text-xs text-ink-muted">
              {row.marketTitle}
            </span>
          )}
        </div>
      </td>
      <td className="px-3 py-3 text-right">
        <span
          className={`tabular text-sm font-medium ${
            isBestBid ? "rounded bg-positive/15 px-1.5 text-positive" : "text-ink"
          }`}
        >
          {formatCents(row.bestBid)}
        </span>
      </td>
      <td className="px-3 py-3 text-right">
        <span
          className={`tabular text-sm font-medium ${
            isBestAsk ? "rounded bg-brand/15 px-1.5 text-brand" : "text-ink"
          }`}
        >
          {formatCents(row.bestAsk)}
        </span>
      </td>
      <td className="px-3 py-3 text-right tabular text-sm text-ink-muted">
        {formatCents(row.mid)}
      </td>
      <td className="py-3 pl-3 pr-4 text-right">
        <RelationBadge relation={row.relation} confidence={row.confidence} />
      </td>
    </tr>
  );
}

function CrossVenueTable({
  rows,
  bestBidVenue,
  bestAskVenue,
}: {
  rows: PriceComparisonDTO[];
  bestBidVenue?: string;
  bestAskVenue?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full min-w-[560px] border-collapse">
        <thead>
          <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-ink-faint">
            <th className="py-2.5 pl-4 pr-3 font-medium">Venue</th>
            <th className="px-3 py-2.5 text-right font-medium">Best bid</th>
            <th className="px-3 py-2.5 text-right font-medium">Best ask</th>
            <th className="px-3 py-2.5 text-right font-medium">Mid</th>
            <th className="py-2.5 pl-3 pr-4 text-right font-medium">Match</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <PriceRow
              key={`${r.venue}-${r.marketId}`}
              row={r}
              isBestBid={r.venue === bestBidVenue}
              isBestAsk={r.venue === bestAskVenue}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Shown when PMXT has prices on only one venue (so there's no cross-venue gap to
 * compute). Rather than an empty error, we surface the venue's own live book and
 * per-outcome prices — still useful context for the user.
 */
function SingleVenueView({
  market,
  row,
  fetchedAt,
}: {
  market: MarketDTO | null;
  row: PriceComparisonDTO | null;
  fetchedAt: number;
}) {
  const venue = market?.venue ?? row?.venue ?? null;
  const url = market?.url ?? row?.url ?? null;
  const outcomes = market?.outcomes ?? [];
  const hasBook = row != null && (row.bestBid != null || row.bestAsk != null);

  // Truly nothing to show: no market record and no book.
  if (!market && !hasBook) {
    return (
      <MessageState title="Prices unavailable right now">
        <p>
          PMXT didn&apos;t return live prices for this market. The order book may be
          empty at the moment — try again shortly.
        </p>
      </MessageState>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink">
          <VenueBadge venue={venue} />
          Listed on a single venue
        </div>
        <p className="mt-1 text-sm text-ink-muted">
          PMXT found this market on only one venue, so there&apos;s no cross-venue gap to
          compute. Showing this venue&apos;s current prices.
        </p>
      </div>

      {outcomes.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[360px] border-collapse">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-ink-faint">
                <th className="py-2.5 pl-4 pr-3 font-medium">Outcome</th>
                <th className="px-3 py-2.5 text-right font-medium">Price</th>
                <th className="py-2.5 pl-3 pr-4 text-right font-medium">24h</th>
              </tr>
            </thead>
            <tbody>
              {outcomes.map((o) => (
                <tr key={o.outcomeId} className="border-b border-border last:border-0">
                  <td className="py-3 pl-4 pr-3 text-sm text-ink">{o.label}</td>
                  <td className="px-3 py-3 text-right tabular text-sm font-medium text-ink">
                    {formatCents(o.price)}
                  </td>
                  <td className="py-3 pl-3 pr-4 text-right tabular text-sm text-ink-muted">
                    {formatChange(o.priceChange24h)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {hasBook ? (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-ink-muted">
          <span className="tabular">
            Best bid <span className="text-ink">{formatCents(row!.bestBid)}</span>
          </span>
          <span className="tabular">
            Best ask <span className="text-ink">{formatCents(row!.bestAsk)}</span>
          </span>
          <span className="tabular">
            Mid <span className="text-ink">{formatCents(row!.mid)}</span>
          </span>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-ink-faint">
          {market?.volume24h != null || market?.volume != null ? (
            <span className="tabular">
              24h volume{" "}
              <span className="text-ink-muted">
                {formatUsd(market?.volume24h ?? market?.volume)}
              </span>
            </span>
          ) : null}
          {market?.liquidity != null ? (
            <span className="tabular">
              Liquidity <span className="text-ink-muted">{formatUsd(market.liquidity)}</span>
            </span>
          ) : null}
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="text-brand hover:underline"
            >
              View on venue ↗
            </a>
          ) : null}
        </div>
        <Freshness fetchedAt={fetchedAt} label="Prices" staleAfter={30_000} />
      </div>
    </div>
  );
}

export async function PriceComparison({ marketId }: { marketId: string }) {
  if (!isPmxtConfigured()) return <SetupHint />;

  try {
    const [{ data: rows, fetchedAt }, { data: market }] = await Promise.all([
      fetchMarketPrices(marketId),
      fetchMarket(marketId),
    ]);

    const venueCount = new Set(rows.map((r) => r.venue)).size;

    // Single venue (or no comparison rows): there's no cross-venue gap, so show
    // the venue's own data rather than an empty error state.
    if (venueCount < 2) {
      return (
        <SingleVenueView market={market} row={rows[0] ?? null} fetchedAt={fetchedAt} />
      );
    }

    const edge = computeEdge(rows);
    const bestBidVenue = edge?.sellVenue;
    const bestAskVenue = edge?.buyVenue;
    const reasoning = rows.find((r) => r.reasoning)?.reasoning;

    return (
      <div className="space-y-3">
        {edge ? <EdgeBanner edge={edge} /> : null}

        <CrossVenueTable
          rows={rows}
          bestBidVenue={bestBidVenue}
          bestAskVenue={bestAskVenue}
        />

        <div className="flex items-center justify-between gap-3">
          {reasoning ? (
            <p className="text-xs text-ink-faint">
              <span className="text-ink-muted">Match reasoning:</span> {reasoning}
            </p>
          ) : (
            <span />
          )}
          <Freshness fetchedAt={fetchedAt} label="Prices" staleAfter={30_000} />
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof PmxtConfigError) return <SetupHint />;
    return <ErrorState message={err instanceof Error ? err.message : undefined} />;
  }
}
