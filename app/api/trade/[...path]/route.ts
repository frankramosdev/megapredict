import { NextRequest, NextResponse } from "next/server";

/**
 * Trading proxy for the PMXT builder widgets (the tradable card the
 * `MarketSearch` widget renders on pick, `OrderTicket`, etc.).
 *
 * Bring-your-own-key by design: there is NO server-key fallback here. The
 * caller must supply their own `Authorization: Bearer <user PMXT key>` header,
 * so visitors can never trade on the house account. Requests without it 401.
 *
 * Build endpoints return unsigned transactions/typed data that the user's own
 * wallet signs client-side — this server never moves funds.
 *
 * No `export const dynamic` here: under Next 16 Cache Components that route
 * segment config is disallowed. Reading the request headers/body already makes
 * this handler dynamic, and the upstream `fetch` uses `cache: "no-store"`.
 */

const TRADE_BASE = process.env.TRADING_API_URL ?? "https://trade.pmxt.dev";

const POST_ALLOW: RegExp[] = [
  /^v0\/trade\/build-order$/,
  /^v0\/trade\/submit-order$/,
  /^v0\/orders\/cancel\/build$/,
  /^v0\/orders\/cancel$/,
  /^escrow\/build-approve$/,
  /^escrow\/build-deposit$/,
  /^escrow\/build-withdrawal$/,
];

const GET_ALLOW: RegExp[] = [
  /^v0\/orders\/open$/,
  /^v0\/orders\/[^/]+$/,
  /^user\/escrow-balances$/,
  /^v0\/user\/0x[0-9a-fA-F]+\/(balances|positions|trades)$/,
  /^escrow\/withdrawals\/0x[0-9a-fA-F]+$/,
];

function isAllowed(method: string, joined: string): boolean {
  const list = method === "POST" ? POST_ALLOW : GET_ALLOW;
  return list.some((re) => re.test(joined));
}

async function handle(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const joined = path.join("/");

  if (!isAllowed(request.method, joined)) {
    return NextResponse.json(
      { success: false, error: { message: "Endpoint not allowed", code: "NOT_ALLOWED" } },
      { status: 404 },
    );
  }

  const auth = request.headers.get("authorization");
  if (!auth) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Trading requires your own PMXT key (Authorization header).",
          code: "NO_AUTH",
        },
      },
      { status: 401 },
    );
  }

  const upstream = new URL(`${TRADE_BASE.replace(/\/$/, "")}/${joined}`);
  upstream.search = request.nextUrl.search;

  const init: RequestInit = {
    method: request.method,
    headers: {
      Accept: "application/json",
      Authorization: auth,
      ...(request.method === "POST" ? { "Content-Type": "application/json" } : {}),
    },
    cache: "no-store",
  };
  if (request.method === "POST") {
    init.body = await request.text();
  }

  const res = await fetch(upstream, init);
  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "application/json",
      "Cache-Control": "no-store",
    },
  });
}

export const GET = handle;
export const POST = handle;
