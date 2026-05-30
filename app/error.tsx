"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="rounded-xl border border-negative/30 bg-surface px-6 py-12 text-center">
      <h2 className="text-lg font-medium">Something went wrong</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
        An unexpected error occurred while rendering this page. This is often a transient
        PMXT or network issue.
      </p>
      <button
        onClick={reset}
        className="mt-5 rounded-lg bg-brand-strong px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        Try again
      </button>
    </div>
  );
}
