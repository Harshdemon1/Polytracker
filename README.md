# Polytracker

**Live prediction market tracker built on [Polymarket](https://polymarket.com) data.**

🌐 [polytracker.co.in](https://polytracker.co.in)

---

## What is Polytracker?

Polytracker is a real-time dashboard that lets you browse, filter, and track prediction markets from Polymarket — the world's largest decentralised prediction market platform. Instead of navigating Polymarket's own interface, Polytracker gives you a fast, clean view of what the market thinks will happen across politics, crypto, sports, and more.

---

## Features

- 🔴 **Live market data** — auto-refreshes every 60 seconds from the Polymarket API
- 📈 **Sparkline charts** — see price movement at a glance on every market card
- 🔍 **Filters** — filter by category, sort by volume or end date, and set a minimum volume threshold
- ⭐ **Watchlist** — star markets to save them and filter to your watchlist
- 📊 **Market modal** — click any market for a detailed view with full price history chart and outcome breakdown
- 🌙 **Dark / Light mode** — theme toggle with preference saved locally
- ⚡ **Fast** — loads 1000+ markets in the background in chunks

---

## Tech Stack

- **React + Vite** — frontend framework and build tool
- **Recharts** — price history and sparkline charts
- **Polymarket Gamma API** — market data (questions, outcomes, volume, liquidity)
- **Polymarket CLOB API** — price history for charts
- **Vercel** — hosting and deployment

---

## Getting Started

```bash
# Clone the repo
git clone https://github.com/Harshdemon1/Polytracker.git
cd Polytracker

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## API

Polytracker uses two public Polymarket APIs — no API key required:

| API | Usage |
|-----|-------|
| `gamma-api.polymarket.com` | Market data — questions, outcomes, prices, volume |
| `clob.polymarket.com` | Price history for charts |

---

## License

MIT
