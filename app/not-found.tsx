import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-xl border border-border bg-surface px-6 py-12 text-center">
      <h2 className="text-lg font-medium">Page not found</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
        That page doesn&apos;t exist. Head back to search every prediction market.
      </p>
      <Link
        href="/"
        className="mt-5 inline-block rounded-lg bg-brand-strong px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        Back to search
      </Link>
    </div>
  );
}
