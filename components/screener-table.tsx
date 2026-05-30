import Link from "next/link";
import { fetchScreener, type ScreenerParams } from "@/lib/pmxt/queries";
import { isPmxtConfigured, PmxtConfigError } from "@/lib/pmxt/client";
import {
  clusterGap,
  clusterIsActionable,
  clusterAnchorMarketId,
} from "@/lib/pmxt/policy";
import type { ClusterDTO } from "@/lib/pmxt/types";
import { VenueBadge, RelationBadge, GapBadge } from "./badges";
import { Freshness } from "./freshness";
import { ErrorState, MessageState, SetupHint } from "./states";
import { formatProbability, formatUsd } from "@/lib/format";

function GapCell({ cluster }: { cluster: ClusterDTO }) {
  const { min, max, spread } = clusterGap(cluster);
  if (spread == null) {
    return <span className="text-ink-faint">—</span>;
  }
  const actionable = clusterIsActionable(cluster);
  const pts = Math.round(spread * 100);
  return (
    <div className="flex flex-col items-end gap-0.5">
      <span
        className={`tabular text-sm font-semibold ${
          actionable ? "text-positive" : "text-ink"
        }`}
      >
        {pts} pts
      </span>
      <span className="tabular text-[11px] text-ink-faint">
        {formatProbability(min)} – {formatProbability(max)}
      </span>
    </div>
  );
}

function ClusterRow({ cluster }: { cluster: ClusterDTO }) {
  const anchorId = clusterAnchorMarketId(cluster);
  const primaryRelation = cluster.relations[0];
  const actionable = clusterIsActionable(cluster);
  const title = cluster.canonicalTitle ?? "Untitled cluster";

  return (
    <tr className="border-b border-border transition-colors last:border-0 hover:bg-surface-2">
      <td className="py-3 pl-4 pr-3">
        {anchorId ? (
          <Link
            href={`/markets/${encodeURIComponent(anchorId)}`}
            className="line-clamp-2 max-w-md text-sm font-medium text-ink hover:text-brand"
          >
            {title}
          </Link>
        ) : (
          <span className="line-clamp-2 max-w-md text-sm font-medium text-ink">
            {title}
          </span>
        )}
        {cluster.category ? (
          <div className="mt-0.5 text-[11px] text-ink-faint">{cluster.category}</div>
        ) : null}
      </td>
      <td className="px-3 py-3">
        <div className="flex flex-wrap gap-1">
          {cluster.venues.slice(0, 4).map((v) => (
            <VenueBadge key={v} venue={v} />
          ))}
          {cluster.venues.length > 4 ? (
            <span className="text-[11px] text-ink-faint">
              +{cluster.venues.length - 4}
            </span>
          ) : null}
        </div>
      </td>
      <td className="px-3 py-3">
        {primaryRelation ? (
          <RelationBadge relation={primaryRelation} confidence={cluster.confidence} />
        ) : (
          <span className="text-ink-faint">—</span>
        )}
      </td>
      <td className="px-3 py-3 text-right">
        <GapCell cluster={cluster} />
      </td>
      <td className="px-3 py-3 text-right tabular text-sm text-ink-muted">
        {formatUsd(cluster.volume24h)}
      </td>
      <td className="py-3 pl-3 pr-4 text-right">
        <GapBadge actionable={actionable} />
      </td>
    </tr>
  );
}

export async function ScreenerTable({ params }: { params: ScreenerParams }) {
  if (!isPmxtConfigured()) return <SetupHint />;

  try {
    const { data: clusters, fetchedAt } = await fetchScreener(params);

    if (clusters.length === 0) {
      return (
        <MessageState title="No matched clusters for these filters">
          <p>Loosen the relation filter or lower the minimum venue count.</p>
        </MessageState>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-ink-muted">
            <span className="text-ink">{clusters.length}</span> cross-venue clusters
          </span>
          <Freshness fetchedAt={fetchedAt} label="Clusters updated" staleAfter={300_000} />
        </div>
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-ink-faint">
                <th className="py-2.5 pl-4 pr-3 font-medium">Market</th>
                <th className="px-3 py-2.5 font-medium">Venues</th>
                <th className="px-3 py-2.5 font-medium">Relation</th>
                <th className="px-3 py-2.5 text-right font-medium">Gap</th>
                <th className="px-3 py-2.5 text-right font-medium">24h Vol</th>
                <th className="py-2.5 pl-3 pr-4 text-right font-medium">Signal</th>
              </tr>
            </thead>
            <tbody>
              {clusters.map((c) => (
                <ClusterRow key={c.clusterId} cluster={c} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof PmxtConfigError) return <SetupHint />;
    return <ErrorState message={err instanceof Error ? err.message : undefined} />;
  }
}
