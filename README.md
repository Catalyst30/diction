# Diction

**Earn and spend wisely, without going broke.**

Diction is a money app for people with irregular income: freelancers, creators and gig workers. It reads your Sui wallet, works out how much you can *safely* spend after bills, tax and your own paycheck, and learns over time which clients pay late. What it learns is stored as encrypted memory on **Walrus**, and wallet data is read through **Tatum**.

Built for the **Tatum x Walrus "Total Recall" hackathon**.

- **Live demo:** https://diction-three.vercel.app
- **Demo video:** [ADD LINK]
- **Blog post:** [ADD LINK]
- **Track:** Consumer Finance Apps

---

## The problem

Freelancers do not get paid on a schedule. A $4,000 invoice lands, it feels like a good month, and the money is spent before rent, tax and the next quiet month arrive. Clients who pay "in 7 days" often pay in 25. Most budgeting apps assume a steady salary, so they cannot help.

## What Diction does

| Feature | What it means for the user |
|---|---|
| **Safe-to-spend number** | One large figure: what you can spend today after bills, tax and your paycheck are covered. |
| **Wallet connection** | Connect a Sui wallet. Diction reads your assets and their dollar value. It never holds or moves your money. |
| **Live activity** | Balance changes are detected every 15 seconds and shown as "Money in" or "Money out". A warning appears if recent spending is above what is safe. |
| **Client trust scores** | Each client has a trust score that falls when they pay late, so late payers count for less in your forecast. |
| **What Diction Learned** | Every saved memory is listed in plain words with a blob ID as proof it is stored on Walrus. |
| **Self-salary and tax set-aside** | Income is split into tax, bills, paycheck and buffer. Tax uses a rate you choose for your country. |
| **Ask Diction** | A small assistant that answers "Can I afford this?" using your real numbers. |
| **Accessible design** | Large text, high contrast, big buttons, light and dark mode, and a layout that works on phones. |

## How it works

```
 Browser (React + Vite)
   |  connect Sui wallet (Wallet Standard)
   |  /api/wallet/sui-activity, /api/tatum/memories
   v
 Server functions (Express, run as a Vercel function)
   |-- Tatum Sui gRPC ---------> balances, coin info   (sui-mainnet-grpc.gateway.tatum.io)
   |-- Tatum Data API ---------> USD prices
   '-- Walrus Memory relayer --> remember / recall      (relayer.memory.walrus.xyz)
```

All keys stay on the server. The browser never sees them.

### How Tatum is used

- **Sui mainnet gRPC** through Tatum's gateway (`sui-mainnet-grpc.gateway.tatum.io:443`) with an `x-api-key` header.
- Reads every coin balance in the connected wallet (`ListBalances`, with `GetBalance` as a fallback) and coin details (`GetCoinInfo`).
- **Tatum's rate API** turns token amounts into dollar values.
- Balance changes between polls become the live feed.

### How Walrus Memory is used

Diction writes what it learns to Walrus Memory with the official SDK (`@mysten-incubation/memwal`) on **mainnet**:

- `remember` stores each memory. A memory counts as saved only when Walrus returns a real `blob_id`. Failed writes retry in the background and the app never shows "Saved" for a write that did not succeed.
- `recall` and the memory list are read back from Walrus when the page loads. What Diction has learned survives refreshes and server restarts.
- Memory types: client payment timing, user notes, payments received, tax and paycheck rules.

### How it learns over time

When a client pays, Diction records how many days late or early it was, as a Walrus memory tagged like this:

```
Client payment: Apex Studio paid 25 days late. PAYMENT_LAG client=Apex Studio expected=2026-07-08 received=2026-08-02 lag=25
```

From those memories it recalculates, per client:

- **average delay** and **on-time share** (paid within 2 days)
- **trust** = `on-time share x 0.7 + 0.3 x max(0, 1 - average delay / 30)`, kept between 20% and 95%
- the learned score is blended with the starting estimate, trusting the evidence fully after 3 observations

Expected income counts toward safe-to-spend **multiplied by trust**. In testing, three late payments from one client dropped its trust from 65% to 20% and lowered the safe-to-spend figure by roughly $1,700.

### Safe-to-spend

```
safe to spend = buffer balance
              - bills due before payday
              - tax set aside
              - next paycheck owed
              + expected income x client trust
```

It never shows a negative number. When it would be negative, a Gap Alert is shown instead. All figures are estimates and not tax or financial advice.

## Tech stack

- **Front end:** React, TypeScript, Vite, Tailwind CSS
- **Back end:** Node.js, Express (served as a Vercel function from `api/index.mjs`)
- **Walrus:** `@mysten-incubation/memwal`
- **Sui:** `@mysten/sui` (gRPC), `@mysten/wallet-standard`, `@grpc/grpc-js`
- **Hosting:** Vercel
- **Built with:** Tatum AI Builder, then extended by hand

## Run it locally

You need Node.js 20 or newer.

```bash
git clone https://github.com/Catalyst30/diction.git
cd diction
npm install
```

Create a file named `.env` in the project folder:

```
TATUM_API_KEY=your-tatum-mainnet-key
MEMWAL_PRIVATE_KEY=your-walrus-delegate-private-key
MEMWAL_ACCOUNT_ID=0x-your-walrus-account-id
MEMWAL_SERVER_URL=https://relayer.memory.walrus.xyz
```

Then:

```bash
npm run walrus-test   # writes one real memory to Walrus mainnet and prints its blob_id
npm run dev           # starts the app
```

Open the address printed in the terminal.

| Variable | What it is |
|---|---|
| `TATUM_API_KEY` | Your Tatum API key (from dashboard.tatum.io) |
| `MEMWAL_PRIVATE_KEY` | The **private** delegate key from memory.walrus.xyz. This is secret. |
| `MEMWAL_ACCOUNT_ID` | Your Walrus Memory account ID (starts with `0x`) |
| `MEMWAL_SERVER_URL` | `https://relayer.memory.walrus.xyz` for mainnet |
| `MEMWAL_NAMESPACE` | Optional. Defaults to `diction`. |

Never commit `.env`. It is already in `.gitignore`.

## Deploy

Import the repo into Vercel, add the four environment variables above, and deploy. `vercel.json` routes all `/api/*` requests to the server function.

## Project structure

```
api/index.mjs             Vercel entry point (wraps the Express routes)
server/walrus-memory.mjs  Walrus Memory read and write, with honest save status
server/routes/wallet.mjs  Sui balances through Tatum gRPC, USD pricing
server/routes/tatum.mjs   Memory, assistant and proof routes
server/tatum-client.mjs   Tatum HTTP helper (key never leaves the server)
src/App.tsx               Main screens
src/WalletPanel.tsx       Wallet connect pop-up, assets, live activity, theme toggle
src/learning.ts           Learning from payment timing
src/LearningPanel.tsx     "How Diction is learning your clients"
scripts/walrus-test.mjs   One-command check that Walrus mainnet writes work
```

## Proof of mainnet memories

Memories stored on Walrus mainnet by this app (blob IDs):

| # | Memory | Blob ID |
|---|---|---|
| 1 | [ADD] | [ADD] |
| 2 | [ADD] | [ADD] |
| 3 | [ADD] | [ADD] |
| ... | | |

Live list: https://diction-three.vercel.app/api/tatum/memories

## Hackathon checklist

- [x] Walrus Memory integrated and writing on mainnet
- [x] Tatum RPC used for onchain data (Sui gRPC)
- [ ] At least 10 memories stored on mainnet (see table above)
- [ ] Published blog post
- [x] Working demo and public repo
- [x] Built with Tatum AI Builder
- [ ] Shared on X or LinkedIn, tagging @Tatum_io and @WalrusFoundation

## Known limitations

We would rather say these plainly:

- **Shared memory.** This demo uses a single Walrus account and namespace for everyone, so it is a single-user demo. Per-user memory, with wallet-signature checks, is the next step. Do not enter real private details.
- **Some demo data remains.** Starter clients and bills are sample data until a user records real ones.
- **Live feed.** Sui's gRPC has no per-address transaction history, so the feed shows balance changes detected while the page is open. It does not show older history.
- **Sui only.** An EVM wallet prototype was removed because Tatum's free plan restricts `eth_call`. Multi-chain support is future work.
- **No custody.** Diction only reads your wallet. It does not move funds.
- **Estimates only.** Tax figures use a rate the user types in and are not tax advice.

## Roadmap

- Per-user memory with wallet-signature login
- More chains
- A "Pay yourself" payday transfer that the user approves in their own wallet
- Alerts before bills land in a low-cash week


cc: valourxbt.
