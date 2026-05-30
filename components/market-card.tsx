import Link from "next/link";
import type { MarketDTO } from "@/lib/pmxt/types";
import { VenueBadge } from "./badges";
import {
  formatCents,
  formatProbability,
  formatResolutionDate,
  formatUsd,
} from "@/lib/format";

function OutcomeBar({ market }: { market: MarketDTO }) {
  // Binary markets: a single probability bar for the Yes side.
  const yes =
    market.outcomes.find((o) => o.label.toLowerCase() === "yes") ?? market.outcomes[0];
  if (!yes || yes.price == null) return null;

  if (market.outcomes.length <= 2) {
    const pct = Math.round(yes.price * 100);
    return (
      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-ink-muted">{yes.label}</span>
          <span className="tabular font-medium text-ink">{formatProbability(yes.price)}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-brand"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  }

  // Multi-outcome: list the top outcomes by price.
  const top = [...market.outcomes]
    .filter((o) => o.price != null)
    .sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
    .slice(0, 3);
  return (
    <ul className="mt-3 space-y-1.5">
      {top.map((o) => (
        <li key={o.outcomeId} className="flex items-center justify-between text-xs">
          <span className="truncate pr-2 text-ink-muted">{o.label}</span>
          <span className="tabular font-medium text-ink">{formatCents(o.price)}</span>
        </li>
      ))}
    </ul>
  );
}

export function MarketCard({ market }: { market: MarketDTO }) {
  return (
    <Link
      href={`/markets/${encodeURIComponent(market.marketId)}`}
      className="group flex flex-col rounded-xl border border-border bg-surface p-4 transition-colors hover:border-border-strong hover:bg-surface-2"
    >
      <div className="flex items-center gap-2">
        <VenueBadge venue={market.venue} />
        {market.category ? (
          <span className="text-[11px] text-ink-faint">{market.category}</span>
        ) : null}
        {market.status && market.status !== "active" ? (
          <span className="ml-auto text-[11px] capitalize text-ink-faint">
            {market.status}
          </span>
        ) : null}
      </div>

      <h3 className="mt-2 line-clamp-2 text-sm font-medium leading-snug text-ink group-hover:text-white">
        {market.title}
      </h3>

      <OutcomeBar market={market} />

      <div className="mt-auto flex items-center justify-between gap-2 pt-4 text-[11px] text-ink-faint">
        <span className="tabular">Vol {formatUsd(market.volume24h ?? market.volume)}</span>
        <span>{formatResolutionDate(market.resolutionDate)}</span>
      </div>
    </Link>
  );
}

export function MarketCardSkeleton() {
  return (
    <div className="flex h-[150px] animate-pulse flex-col rounded-xl border border-border bg-surface p-4">
      <div className="h-4 w-16 rounded bg-surface-2" />
      <div className="mt-3 h-4 w-full rounded bg-surface-2" />
      <div className="mt-2 h-4 w-2/3 rounded bg-surface-2" />
      <div className="mt-auto h-2 w-full rounded bg-surface-2" />
    </div>
  );
}
