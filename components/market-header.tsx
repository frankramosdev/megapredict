import { fetchMarket } from "@/lib/pmxt/queries";
import { isPmxtConfigured } from "@/lib/pmxt/client";
import { VenueBadge } from "./badges";
import { formatResolutionDate, formatUsd } from "@/lib/format";

export async function MarketHeader({ marketId }: { marketId: string }) {
  if (!isPmxtConfigured()) {
    return (
      <h1 className="text-2xl font-semibold tracking-tight">Market comparison</h1>
    );
  }

  const { data: market } = await fetchMarket(marketId);

  if (!market) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Market comparison</h1>
        <p className="mt-1 text-sm text-ink-faint">
          Couldn&apos;t load this market&apos;s details — prices below may still resolve.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <VenueBadge venue={market.venue} />
        {market.category ? (
          <span className="text-xs text-ink-faint">{market.category}</span>
        ) : null}
        {market.status ? (
          <span className="text-xs capitalize text-ink-faint">· {market.status}</span>
        ) : null}
      </div>

      <h1 className="text-pretty text-2xl font-semibold leading-tight tracking-tight">
        {market.title}
      </h1>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-ink-muted">
        <span className="tabular">
          24h volume{" "}
          <span className="text-ink">{formatUsd(market.volume24h ?? market.volume)}</span>
        </span>
        <span className="tabular">
          Liquidity <span className="text-ink">{formatUsd(market.liquidity)}</span>
        </span>
        <span>
          Resolves{" "}
          <span className="text-ink">{formatResolutionDate(market.resolutionDate)}</span>
        </span>
        {market.url ? (
          <a
            href={market.url}
            target="_blank"
            rel="noreferrer"
            className="text-brand hover:underline"
          >
            View on venue ↗
          </a>
        ) : null}
      </div>

      {market.description ? (
        <details className="group rounded-lg border border-border bg-surface p-3">
          <summary className="cursor-pointer text-xs font-medium text-ink-muted">
            Resolution criteria
          </summary>
          <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-ink-faint">
            {market.description}
          </p>
        </details>
      ) : null}
    </div>
  );
}
