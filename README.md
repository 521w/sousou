# Sousou — OSINT Search Engine (Tether-Alpha v4.0)

Professional-grade privacy-first Open Source Intelligence (OSINT) forensic search engine.

## Modules

| Module | Endpoint | Description |
|--------|----------|-------------|
| **Email** | `POST /api/osint/probe` | HIBP breach check (k-anonymity, no key needed) + HIBP breach names + Gravatar lookup + disposable/freemail detection |
| **Phone** | `POST /api/osint/probe` | CN carrier detection (CMCC/CUCC/CTCC/CBN) + country identification |
| **Username** | `POST /api/osint/probe` | Sherlock-style cross-platform search across 30 platforms (GitHub, Twitter, Instagram, Reddit, TikTok, Telegram, Steam, V2EX, Zhihu, etc.) |
| **IP** | `POST /api/osint/probe` | ip-api.com lookup — ISP, org, AS, geo, proxy/hosting/mobile detection |
| **Domain** | `POST /api/osint/probe` | RDAP WHOIS — nameservers, status, entities |
| **Web Dorks** | `POST /api/osint/probe` | Auto-generated Google dorks — pastebin leaks, GitHub secrets, cloud storage, config files, SQL dumps, CN forums |
| **X/Twitter** | `GET /api/search/x?q=` | Twitter v2 API search (needs `X_BEARER_TOKEN`) |
| **AI Summary** | `POST /api/osint/probe` | Gemini 2.0 Flash summary of findings (needs `GEMINI_API_KEY`) |

All individual modules also have GET endpoints: `/api/email/:email`, `/api/phone/:phone`, `/api/username/:username`, `/api/ip/:ip`, `/api/domain/:domain`.

## Data Sources (all free, no paid APIs required)

- **HIBP** — k-anonymity model (password range API, no key required)
- **HIBP Breach Names** — optional, needs free `HIBP_API_KEY`
- **Gravatar** — public profile images and accounts
- **ip-api.com** — free tier, 45 req/min
- **RDAP** — free WHOIS replacement
- **Google Gemini** — optional AI summary

## Setup

```bash
cp .env.example .env
# Edit .env with your keys (only GEMINI_API_KEY and X_BEARER_TOKEN needed for full features)
npm install
npm run dev
```

## Architecture

```
server.ts              — Express + Vite dev server, unified probe endpoint
src/modules/
  email.ts             — HIBP + Gravatar + disposable detection
  phone.ts             — CN carrier/region detection
  username.ts          — 30-platform cross-check (Sherlock-style)
  ipdomain.ts          — IP geolocation + Domain RDAP + Dork generation
src/App.tsx            — React frontend
```

## v4.0 Changes

- Replaced fake `Math.random()` forensic engine with real API-backed modules
- Email: real HIBP breach data (not fabricated)
- Username: real HTTP probes to 30 platforms (not fake social graph)
- All data sources are free and require no API key (except optional Gemini + X)
- Modular architecture — easy to add new modules