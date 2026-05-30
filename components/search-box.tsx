"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

/**
 * Search input that drives the URL (`/?q=...`). Submitting navigates so results
 * render as Server Components and the query is shareable/bookmarkable. A pending
 * transition state gives immediate feedback while the RSC payload streams in.
 *
 * Reads the current query from `useSearchParams()` (client-side) rather than a
 * server prop, so the hero stays static under Next 16 Cache Components — the
 * only dynamic `searchParams` read lives inside the results Suspense boundary.
 */
export function SearchBox({ autoFocus = false }: { autoFocus?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [value, setValue] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(initialQuery);
  }, [initialQuery]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    startTransition(() => {
      router.push(q ? `/?q=${encodeURIComponent(q)}` : "/");
    });
  }

  return (
    <form onSubmit={submit} className="relative">
      <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="m21 21-4.3-4.3M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoFocus={autoFocus}
        type="search"
        enterKeyHint="search"
        placeholder="Search every prediction market — “election”, “Bitcoin $100k”, “Fed cut”…"
        aria-label="Search prediction markets"
        className="w-full rounded-xl border border-border bg-surface py-3.5 pl-11 pr-28 text-[15px] text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-brand/60 focus:bg-surface-2"
      />
      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-brand-strong px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        disabled={isPending}
      >
        {isPending ? "Searching…" : "Search"}
      </button>
    </form>
  );
}
