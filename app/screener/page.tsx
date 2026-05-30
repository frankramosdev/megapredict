import { Suspense } from "react";
import type { Metadata } from "next";
import { ScreenerFilters } from "@/components/screener-filters";
import { ScreenerTable } from "@/components/screener-table";
import { ACTIONABLE_CONFIDENCE } from "@/lib/pmxt/policy";
import type { Relation } from "@/lib/pmxt/types";

export const metadata: Metadata = {
  title: "Screener",
  description:
    "Screen cross-venue matched prediction-market clusters by relation, venue count, price gap, and volume.",
};

const VALID_RELATIONS: Relation[] = [
  "identity",
  "subset",
  "superset",
  "overlap",
  "complement",
  "disjoint",
];

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex animate-pulse items-center gap-4 border-b border-border px-4 py-4 last:border-0"
        >
          <div className="h-4 flex-1 rounded bg-surface-2" />
          <div className="h-4 w-24 rounded bg-surface-2" />
          <div className="h-4 w-16 rounded bg-surface-2" />
          <div className="h-4 w-16 rounded bg-surface-2" />
        </div>
      ))}
    </div>
  );
}

/** Reads filter params inside the Suspense boundary (Cache Components rule). */
async function ResolvedTable({
  searchParams,
}: {
  searchParams: Promise<{ relation?: string; sort?: string; minVenues?: string }>;
}) {
  const sp = await searchParams;
  const relation =
    sp.relation && VALID_RELATIONS.includes(sp.relation as Relation)
      ? (sp.relation as Relation)
      : undefined;
  const sort = sp.sort === "confidence" ? "confidence" : "volume";
  const minVenues = Number(sp.minVenues) || 2;

  return <ScreenerTable params={{ relation, sort, minVenues }} />;
}

export default function ScreenerPage({
  searchParams,
}: {
  searchParams: Promise<{ relation?: string; sort?: string; minVenues?: string }>;
}) {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Cross-venue screener</h1>
        <p className="max-w-2xl text-sm text-ink-muted">
          Matched market clusters across every venue PMXT covers. A{" "}
          <span className="font-medium text-positive">green “actionable gap”</span> means
          the same question (relation <code className="text-ink">identity</code>) at ≥
          {Math.round(ACTIONABLE_CONFIDENCE * 100)}% confidence — otherwise the markets are
          related but you should verify resolution rules before treating the spread as an
          arb.
        </p>
      </header>

      <Suspense fallback={<div className="h-9" />}>
        <ScreenerFilters />
      </Suspense>

      <Suspense fallback={<TableSkeleton />}>
        <ResolvedTable searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
