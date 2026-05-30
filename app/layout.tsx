import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "megapredict — the prediction market screener",
    template: "%s · megapredict",
  },
  description:
    "Search, compare, and screen every major prediction market in one place. Cross-venue odds, liquidity, and price gaps across Polymarket, Kalshi, Limitless, and more.",
  openGraph: {
    title: "Mega Predict",
    description: "One search for every Prediction Market — powered by PMXT",
    siteName: "megapredict",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mega Predict",
    description: "One search for every Prediction Market — powered by PMXT",
  },
};

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-canvas/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-brand-strong text-[13px] font-bold text-white">
            m
          </span>
          <span>megapredict</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/"
            className="rounded-md px-3 py-1.5 text-ink-muted transition-colors hover:bg-surface hover:text-ink"
          >
            Search
          </Link>
          <Link
            href="/screener"
            className="rounded-md px-3 py-1.5 text-ink-muted transition-colors hover:bg-surface hover:text-ink"
          >
            Screener
          </Link>
        </nav>
        <div className="ml-auto">
          <a
            href="https://pmxt.dev/docs"
            target="_blank"
            rel="noreferrer"
            className="hidden text-xs text-ink-faint transition-colors hover:text-ink-muted sm:block"
          >
            data via PMXT ↗
          </a>
        </div>
      </div>
    </header>
  );
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-dvh">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
        <footer className="mx-auto max-w-7xl px-4 pb-10 pt-4 text-xs text-ink-faint sm:px-6">
          megapredict is a read-only aggregator. Always verify resolution terms on the
          venue before trading. Data via the{" "}
          <a
            href="https://pmxt.dev"
            target="_blank"
            rel="noreferrer"
            className="underline decoration-dotted underline-offset-2 hover:text-ink-muted"
          >
            PMXT Router
          </a>
          .
        </footer>
      </body>
    </html>
  );
}
