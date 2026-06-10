import Link from "next/link";

export function MessageState({
  title,
  children,
  tone = "neutral",
}: {
  title: string;
  children?: React.ReactNode;
  tone?: "neutral" | "error" | "warning";
}) {
  const border =
    tone === "error"
      ? "border-negative/30"
      : tone === "warning"
        ? "border-warning/30"
        : "border-border";
  return (
    <div
      className={`rounded-xl border ${border} bg-surface px-6 py-10 text-center`}
    >
      <h3 className="text-base font-medium text-ink">{title}</h3>
      {children ? (
        <div className="mx-auto mt-2 max-w-md text-sm text-ink-muted">{children}</div>
      ) : null}
    </div>
  );
}

/** Shown when PMXT_API_KEY is not configured — keeps the app from hard-crashing. */
export function SetupHint() {
  return (
    <MessageState title="Connect PMXT to load market data" tone="warning">
      <p>
        Set the <code className="rounded bg-surface-2 px-1 py-0.5">PMXT_API_KEY</code>{" "}
        environment variable, then restart the dev server. Get a key at{" "}
        <a
          href="https://pmxt.dev/dashboard"
          target="_blank"
          rel="noreferrer"
          className="text-brand underline underline-offset-2"
        >
          pmxt.dev/dashboard
        </a>
        . See <code className="rounded bg-surface-2 px-1 py-0.5">.env.example</code>.
      </p>
    </MessageState>
  );
}

const TLS_ERROR = /ssl|tls|EPROTO|packet length|alert protocol|certificate|handshake|fetch failed/i;

export function ErrorState({ message }: { message?: string }) {
  const isTls = message && TLS_ERROR.test(message);
  return (
    <MessageState title="Couldn't reach PMXT" tone="error">
      {isTls ? (
        <p>
          The connection to <code className="rounded bg-surface-2 px-1 py-0.5">api.pmxt.dev</code>{" "}
          failed with a TLS error. This is a <strong>network-level issue</strong> — the API itself
          is up, but cannot be reached from this machine over HTTPS. Try opening{" "}
          <a
            href="https://api.pmxt.dev/health"
            target="_blank"
            rel="noreferrer"
            className="text-brand underline underline-offset-2"
          >
            api.pmxt.dev/health
          </a>{" "}
          in your browser. If it loads, check for a VPN, firewall, or proxy intercepting TLS on
          port 443. Details: <code className="rounded bg-surface-2 px-1 py-0.5">{message}</code>
        </p>
      ) : (
        <p>
          The Router request failed{message ? `: ${message}` : "."}. This is usually a
          transient network or rate-limit issue — try again in a moment.
        </p>
      )}
    </MessageState>
  );
}

export function NoResults({ query }: { query?: string }) {
  return (
    <MessageState title={query ? `No markets matching “${query}”` : "No results"}>
      <p>
        Try a broader query, or browse the{" "}
        <Link href="/screener" className="text-brand underline underline-offset-2">
          cross-venue screener
        </Link>
        .
      </p>
    </MessageState>
  );
}
