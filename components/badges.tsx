import type { Relation } from "@/lib/pmxt/types";
import { titleCase } from "@/lib/format";

const VENUE_COLORS: Record<string, string> = {
  polymarket: "bg-[#1d2b53] text-[#9db4ff]",
  kalshi: "bg-[#1b3a2e] text-[#6ee7b7]",
  limitless: "bg-[#2e1d3a] text-[#d8b4fe]",
  smarkets: "bg-[#3a2e1b] text-[#fcd34d]",
  myriad: "bg-[#1b2f3a] text-[#7dd3fc]",
  probable: "bg-[#2f1b2e] text-[#f9a8d4]",
};

export function VenueBadge({ venue }: { venue: string | null | undefined }) {
  if (!venue) return null;
  const key = venue.toLowerCase();
  const color = VENUE_COLORS[key] ?? "bg-surface-2 text-ink-muted";
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium ${color}`}
    >
      {titleCase(venue)}
    </span>
  );
}

const RELATION_STYLES: Record<Relation, string> = {
  identity: "bg-positive/15 text-positive border-positive/30",
  subset: "bg-brand/15 text-brand border-brand/30",
  superset: "bg-brand/15 text-brand border-brand/30",
  overlap: "bg-warning/15 text-warning border-warning/30",
  complement: "bg-warning/15 text-warning border-warning/30",
  disjoint: "bg-negative/15 text-negative border-negative/30",
};

export function RelationBadge({
  relation,
  confidence,
}: {
  relation: Relation;
  confidence?: number;
}) {
  const style = RELATION_STYLES[relation] ?? "bg-surface-2 text-ink-muted border-border";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-medium ${style}`}
    >
      {titleCase(relation)}
      {confidence != null ? (
        <span className="tabular opacity-70">{Math.round(confidence * 100)}%</span>
      ) : null}
    </span>
  );
}

export function GapBadge({ actionable }: { actionable: boolean }) {
  if (actionable) {
    return (
      <span className="inline-flex items-center gap-1 rounded border border-positive/40 bg-positive/15 px-1.5 py-0.5 text-[11px] font-semibold text-positive">
        Actionable gap
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded border border-warning/30 bg-warning/10 px-1.5 py-0.5 text-[11px] font-medium text-warning">
      Related · verify rules
    </span>
  );
}
