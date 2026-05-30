"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import type { Relation } from "@/lib/pmxt/types";

const RELATION_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All relations" },
  { value: "identity", label: "Identity (same question)" },
  { value: "subset", label: "Subset" },
  { value: "superset", label: "Superset" },
  { value: "overlap", label: "Overlap" },
];

const MIN_VENUES_OPTIONS = [2, 3, 4];

const VALID_RELATIONS = new Set(["identity", "subset", "superset", "overlap"]);

export function ScreenerFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const relationParam = searchParams.get("relation") ?? "";
  const relation: Relation | "" = VALID_RELATIONS.has(relationParam)
    ? (relationParam as Relation)
    : "";
  const sort = searchParams.get("sort") === "confidence" ? "confidence" : "volume";
  const minVenues = Number(searchParams.get("minVenues")) || 2;

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    startTransition(() => {
      router.push(`/screener?${next.toString()}`);
    });
  }

  const selectClass =
    "rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-ink outline-none transition-colors focus:border-brand/60";

  return (
    <div
      className={`flex flex-wrap items-center gap-2 ${isPending ? "opacity-70" : ""}`}
    >
      <label className="flex items-center gap-2 text-xs text-ink-faint">
        Relation
        <select
          className={selectClass}
          value={relation}
          onChange={(e) => setParam("relation", e.target.value)}
        >
          {RELATION_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-xs text-ink-faint">
        Min venues
        <select
          className={selectClass}
          value={String(minVenues)}
          onChange={(e) => setParam("minVenues", e.target.value)}
        >
          {MIN_VENUES_OPTIONS.map((v) => (
            <option key={v} value={v}>
              {v}+
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-xs text-ink-faint">
        Sort by
        <select
          className={selectClass}
          value={sort}
          onChange={(e) => setParam("sort", e.target.value)}
        >
          <option value="volume">24h volume</option>
          <option value="confidence">Match confidence</option>
        </select>
      </label>
    </div>
  );
}
