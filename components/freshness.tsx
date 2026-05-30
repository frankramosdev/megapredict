"use client";

import { useEffect, useState } from "react";
import { formatRelativeTime } from "@/lib/format";

/**
 * Live "updated Xs ago" indicator. Initial render uses `fetchedAt` on both
 * server and client (so hydration matches), then ticks every 5s. Turns amber
 * once data crosses the `staleAfter` threshold so users can spot stale prices.
 */
export function Freshness({
  fetchedAt,
  staleAfter = 60_000,
  label = "Updated",
}: {
  fetchedAt: number;
  staleAfter?: number;
  label?: string;
}) {
  const [now, setNow] = useState(fetchedAt);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(id);
  }, []);

  const stale = now - fetchedAt > staleAfter;

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs ${
        stale ? "text-warning" : "text-ink-faint"
      }`}
      title={new Date(fetchedAt).toLocaleString()}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          stale ? "bg-warning" : "bg-positive"
        }`}
        aria-hidden
      />
      {label} {formatRelativeTime(fetchedAt, now)}
      {stale ? " · stale" : ""}
    </span>
  );
}
