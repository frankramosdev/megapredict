# PMXT Builder Widgets — Integration Reference

**Source:** [pmxt-dev/pmxt-builder-widgets](https://github.com/pmxt-dev/pmxt-builder-widgets)
**Live explorer:** https://builder.pmxt.dev · **Registry:** https://widgets.pmxt.dev
**Package:** `pmxt-widgets` (v0.5.9, MIT)
**Last distilled:** 2026-06-15

> **Venue scope:** Polymarket and Opinion are tradable today; more venues come online as PMXT
> escrow expands. The widgets are framed as production-grade and "ready to paste."
> Browse + live-edit every widget at [builder.pmxt.dev](https://builder.pmxt.dev) — each card
> has a **"Customize & get code"** configurator that emits the exact props/snippet to copy.

> Drop-in React widgets for prediction-market trading. Users trade **inside megapredict**
> while PMXT handles routing, escrow, EIP-712 signing, and builder-fee attribution.
> Non-custodial: orders are signed client-side by the user's own wallet; our server key only
> authenticates the app and **cannot move funds**.

---

## 1. Why this matters for megapredict

megapredict is a read-only PMXT aggregator/screener (see `agents/TECHNICAL_DESIGN.md`). These
widgets are the path to **trading** without building execution, custody, or signing ourselves.
The same PMXT catalog we already read powers the widgets' market data, so they slot directly
onto our existing pages.

- **v1 (read-only) is unchanged** — trading is explicitly out of scope per the PRD.
- When we add trading, prefer these widgets over hand-rolling order flow.
- Until then, widgets can run in **sandbox mode** (live data, simulated fills) for demos.

---

## 2. Two ways to install

### Option A — npm package (fastest)

```bash
npm install pmxt-widgets
```

Import components and the provider directly from `pmxt-widgets`. React `>=18` peer dependency.

### Option B — shadcn registry (recommended for owning the code)

Copy a widget's source into the repo so it lives under `@/components` and `@/lib` like any
other shadcn component:

```bash
npx shadcn@latest add https://widgets.pmxt.dev/r/order-ticket.json
```

Each widget is a shadcn **registry item** (`https://ui.shadcn.com/schema/registry-item.json`).
This is the route to use when we want to restyle widgets to match the megapredict theme.

---

## 3. shadcn technical implementation

The registry follows the standard shadcn `registry.json` / registry-item layout.

### Registry index

`https://widgets.pmxt.dev/r/registry.json` exposes 21 items:

- **1 lib:** `pmxt-core` (`type: registry:lib`) — the client, provider, hooks, and shared
  utilities every widget depends on.
- **20 components** (`type: registry:component`) — one per widget (see catalog in §6).

### How an item is shaped

Example: `order-ticket.json`

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry-item.json",
  "name": "order-ticket",
  "type": "registry:component",
  "title": "Order Ticket",
  "description": "Order Ticket widget for PMXT prediction markets.",
  "dependencies": [],
  "registryDependencies": [
    "https://widgets.pmxt.dev/r/pmxt-core.json",
    "https://widgets.pmxt.dev/r/venue-badge.json"
  ],
  "files": [
    { "path": "registry/pmxt/order-ticket/order-ticket.tsx", "content": "..." }
  ]
}
```

Key points for working with the registry:

- **`registryDependencies` chain.** Every component depends on `pmxt-core.json`; some also
  depend on other component widgets (e.g. `order-ticket` pulls `venue-badge`). `shadcn add`
  resolves these transitively, so adding one trading widget also installs the core lib.
- **Install layout.** When added, source lands under predictable aliases:
  - `@/lib/pmxt/*` — `client`, `provider`, `hooks`, `format`, `venues`, `icons`, `confetti`,
    `sandbox`, `wallet`, `convert`, `types` (the `pmxt-core` lib).
  - `@/components/pmxt/*` — the widget components themselves.
- **Imports are alias-based**, e.g. inside `order-ticket.tsx`:

```tsx
import { useOrderBook, usePositions } from '@/lib/pmxt/hooks';
import { usePmxt } from '@/lib/pmxt/provider';
import { VenueBadge } from '@/components/pmxt/venue-badge';
import { formatPrice, formatUsd } from '@/lib/pmxt/format';
```

- **Theming.** Components are plain Tailwind + the shadcn token system, so once copied they
  inherit our `globals.css` CSS variables. Restyle by editing the copied files, not the package.
- **Registry build.** `apps/demo/scripts/build-registry.mjs` generates the `/r/*.json` files;
  `registry.config.mjs` sets `baseUrl` (overridable with `REGISTRY_BASE_URL` for local preview,
  e.g. `http://localhost:3000`).

---

## 4. Provider & configuration

Wrap any widget tree in `PmxtProvider`. It builds the API client, manages the wallet
connection, and exposes everything via the `usePmxt` hook.

```tsx
import { MarketSearch, PmxtProvider } from 'pmxt-widgets';

export default function App() {
  return (
    <PmxtProvider config={{ apiUrl: '/api/pmxt', tradeUrl: '/api/trade' }}>
      <MarketSearch venues={['polymarket', 'opinion']} />
    </PmxtProvider>
  );
}
```

Clicking an outcome opens a tradable card; the user signs; PMXT routes the trade; the builder
account is attributed.

### `PmxtProviderProps`

| Prop | Type | Notes |
| --- | --- | --- |
| `config` | `PmxtClientConfig` | `{ apiUrl, tradeUrl?, apiKey? }`. URLs should point at **our** proxy routes. |
| `sandbox` | `boolean` | Live market data, fully simulated trading (demo wallet, $1,000 play money, in-memory fills). No order reaches the trade API. |
| `wallet` | `{ address, signer }` | Bring-your-own wallet (e.g. from wagmi); bypasses the built-in injected-wallet flow. |
| `children` | `ReactNode` | Widget tree. |

### Three wallet modes (resolved inside the provider)

1. **Injected (default)** — detects MetaMask / Phantom, silently restores prior authorization
   across reloads (unless the user explicitly disconnected), follows `accountsChanged`,
   surfaces `connectError`. `canDisconnect: true`.
2. **Sandbox** — fixed `SANDBOX_ADDRESS`, a delay-based stub signer, `canDisconnect: false`.
3. **Bring-your-own** — host supplies `address` + `signer`; provider owns nothing,
   `canDisconnect: false`.

### Sandbox usage

```tsx
<PmxtProvider config={{ apiUrl: '/api/pmxt' }} sandbox>
  <App />
</PmxtProvider>
```

> Sandbox covers the full trading flow with play money, **but real-USDC movements
> (`WalletPanel` deposit / withdraw → claim) are disabled in sandbox** — they require a live
> wallet and the trading proxy.

### Context hooks

- `usePmxt()` — `{ client, wallet, sandbox }`. **Throws** outside a provider.
- `usePmxtOptional()` — non-throwing; display widgets use it to upgrade to trading UI only
  when a provider exists.
- `usePmxtWallet()` — wallet slice: `address`, `walletId`, `availableWallets`, `connecting`,
  `connectError`, `connect()`, `disconnect()`, `canDisconnect`, `signer`.

---

## 5. Server proxy routes (required)

The API key is **server-side only** and never reaches the browser. Point `apiUrl` / `tradeUrl`
at same-origin proxies that attach `Authorization: Bearer <PMXT_KEY>`. Reference proxies live in
`apps/demo/app/api/pmxt` and `apps/demo/app/api/trade`. Both use strict allowlists.

### Catalog proxy → `https://api.pmxt.dev` (`/api/pmxt/[...path]`)

Read-only. Falls back to the server `PMXT_API_KEY` when the visitor sends none. Allowlist
(regex `api/<venue>/<method>`):

```
fetchMarkets, fetchMarketsPaginated, fetchMarket,
fetchEvents, fetchEventsPaginated, fetchEvent,
fetchOrderBook, fetchOHLCV, fetchTrades,
fetchMarketMatches, fetchEventMatches, getExecutionPrice
```

plus `v0/matched-market-clusters` and `v0/matched-event-clusters`. Everything else → 404.

### Trading proxy → `https://trade.pmxt.dev` (`/api/trade/[...path]`)

**Bring-your-own-key:** requires the user's own `Authorization` header (no server-key fallback,
so visitors can't trade on the house). Returns 401 if absent. Allowlist:

- **POST:** `v0/trade/build-order`, `v0/trade/submit-order`, `v0/orders/cancel/build`,
  `v0/orders/cancel`, `escrow/build-approve`, `escrow/build-deposit`, `escrow/build-withdrawal`
  (build endpoints return **unsigned** txs the user's wallet must sign).
- **GET:** `v0/orders/open`, `user/escrow-balances`,
  `v0/user/0x…/{balances|positions|trades}`, `escrow/withdrawals/0x…`

Both routes set `export const dynamic = 'force-dynamic'` and `cache: 'no-store'`.

### Environment variables

```bash
PMXT_API_KEY=pmxt_live_your_key          # server-side only — get one at https://pmxt.dev/dashboard
PMXT_API_URL=https://api.pmxt.dev        # catalog API (market data)
TRADING_API_URL=https://trade.pmxt.dev   # trading API (build/submit orders, balances, positions)
```

---

## 6. Widget catalog

All exported from `pmxt-widgets` (and as individual registry items). Each has a matching
`*Props` type export.

### Display

| Widget | Purpose |
| --- | --- |
| `VenueBadge` | Venue label/logo chip. |
| `PriceChip` | Compact price pill. |
| `MarketCard` | Single market; can expand to an inline trade panel. |
| `EventCard` | Event with its markets/outcomes. |
| `MarketSearch` | One search across every venue. **Matched cross-venue results by default**, with `markets` / `events` modes in the dropdown. Picking a result renders an expanded, tradable card below the input. |
| `TopMarkets` | Trending feed: every venue ranked in one unified list, cross-venue matches, or per-venue tabs. Cards expand into a buy/sell ticket on click. |
| `MarketTicker` | Scrolling/live price ticker. |
| `MatchedMarkets` / `MatchedMarketRow` | PMXT's signature view — the same market matched across venues with the **YES price spread highlighted**. Legs expand into an inline ticket. Our arb/compare surface. |

### Data

| Widget | Purpose |
| --- | --- |
| `OrderBookWidget` | Live bid/ask depth ladder for one outcome, polled from `fetchOrderBook`. |
| `PriceChart` | OHLCV price history rendered as a **lightweight inline SVG — no chart library required** (zero extra deps). |
| `ExecutionQuote` | Quoted execution price for a size. |
| `RecentTrades` | Public trade tape. |

### Trading (non-custodial)

| Widget | Purpose |
| --- | --- |
| `OrderTicket` | Full buy/sell ticket with **live quoting, slippage guard, and wallet signing** — build → quote → sign → submit (`compact`, `confetti`, `onDone`). |
| `InlineTradePanel` | Slim trade panel for embedding in cards. |
| `BalanceCard` | Wallet/escrow balances. |
| `WalletPanel` | Fund PMXT escrow: **deposit USDC (smart approve included)** and run the **timelocked withdraw → claim flow**, with live balance and history. ⚠ Moves **real USDC** — not available in sandbox mode. |
| `Positions` | Open positions held in PMXT escrow. **Sell expands an inline sell ticket right in the row.** |
| `OpenOrdersTable` | Resting orders with cancel. |
| `TradeHistory` | User's trade history. |

### Composite

| Widget | Purpose |
| --- | --- |
| `TradingPanel` | The "everything-widget": `PriceChart` + `OrderBookWidget` + `OrderTicket` composed around a single market — one import for a complete trading surface. |

---

## 7. Hooks (`pmxt-widgets`)

Data hooks return a `QueryState` and accept `QueryOptions`; `usePmxtQuery` is the primitive.

- **Catalog:** `useEvents`, `useUnifiedEvents`, `useMarketSearch`, `useUnifiedMarketSearch`,
  `useUnifiedEventSearch`, `useClusters`, `useEventClusters`
- **Market data:** `useOrderBook`, `useOHLCV`, `usePublicTrades`
- **User/account:** `useBalances`, `useEscrowBalances`, `useWithdrawals`, `usePortfolio`,
  `usePositions`, `useOpenOrders`, `useUserTrades`
- **Utility:** `useDebounced`

---

## 8. Client, wallet & helper exports

- **Client:** `PmxtClient`, `PmxtApiError`, `getExecutionPrice`, `unwrapEnvelope`,
  type `PmxtClientConfig`.
- **Convert:** `marketYes`, `marketNo`, `marketQuestion`, `outcomeDisplayLabel`,
  `toPickedMarket`.
- **Wallet (EVM / Polygon):** `createInjectedSigner`, `detectWallets`, `getInjectedProvider`,
  `requestAccounts`, `signTypedData`, `sendTransaction`, `switchChain`,
  `waitForTransactionReceipt`, `readErc20Allowance`; constants `POLYGON_CHAIN_ID`,
  `USDC_E_ADDRESS`, `MICRO_USDC`, `SUPPORTED_WALLETS`, `WALLET_LABELS`; `ConnectWalletButtons`;
  types `Eip1193Provider`, `PmxtSigner`, `WalletId`.
- **Venues:** `venueTheme`, `isTradableVenue`, `TRADABLE_VENUES`.
- **Sandbox:** `SandboxPmxtClient`, `SandboxSession`, `SANDBOX_ADDRESS`,
  `SANDBOX_STARTING_BALANCE_USDC`.
- **UX:** `fireConfetti`, `fireTradeConfetti`; plus everything from `format` and `types`.

> Trades settle in USDC.e on Polygon; build endpoints return unsigned transactions the user's
> wallet signs (EIP-712 / EIP-1193).

---

## 9. Go-live checklist

1. Sign in at https://pmxt.dev and enable **builder mode** in the dashboard.
2. Create an API key at https://www.pmxt.dev/dashboard/api-keys.
3. Put the key on the **server only** (`PMXT_API_KEY`).
4. Point `apiUrl` / `tradeUrl` at proxy routes that add `Authorization: Bearer <key>`.
5. For live trading, require the **user's own** PMXT key (the trade proxy has no server-key
   fallback by design).

---

## 10. Local development (the source repo)

```bash
pnpm install
cp apps/demo/.env.example apps/demo/.env.local   # set PMXT_API_KEY
pnpm dev
pnpm test
```

Monorepo: `packages/widgets` (the package) + `apps/demo` (Next.js demo, registry host, and
reference proxies). Built with `tsup`; tested with `vitest`.
