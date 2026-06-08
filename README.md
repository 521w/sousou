# Sousou

Privacy-first OSINT search dashboard for checking emails, phones, usernames, IPs, domains, web dorks, and optional X/Twitter search.

Sousou is built as a practical investigation interface: enter one target, run multiple lightweight probes, and get structured findings that can be reviewed or summarized.

## What It Does

- Checks email format, breach indicators, Gravatar, and disposable/freemail signals
- Detects phone country/carrier patterns
- Searches username availability/presence across common platforms
- Looks up IP geolocation, ISP, ASN, proxy/hosting/mobile signals
- Queries domain RDAP data
- Generates search dorks for public web investigation
- Optionally searches X/Twitter with a bearer token
- Optionally summarizes findings with Gemini

## Modules

| Module | Endpoint | Description |
| --- | --- | --- |
| Email | `POST /api/osint/probe` | Email analysis, HIBP k-anonymity check, optional breach names, Gravatar lookup |
| Phone | `POST /api/osint/probe` | Country and Chinese carrier pattern detection |
| Username | `POST /api/osint/probe` | Sherlock-style cross-platform username probes |
| IP | `POST /api/osint/probe` | IP geolocation, ISP, ASN, proxy/hosting/mobile indicators |
| Domain | `POST /api/osint/probe` | RDAP WHOIS-style domain information |
| Web Dorks | `POST /api/osint/probe` | Search-query generation for leaks, configs, paste sites, cloud storage, and forums |
| X/Twitter | `GET /api/search/x?q=` | X API search with `X_BEARER_TOKEN` |
| AI Summary | `POST /api/osint/probe` | Gemini summary with `GEMINI_API_KEY` |

Individual endpoints are also available:

```text
GET /api/email/:email
GET /api/phone/:phone
GET /api/username/:username
GET /api/ip/:ip
GET /api/domain/:domain
```

## Good For

- Lightweight OSINT triage
- Personal security checks
- Username and account-surface review
- Domain/IP background checks
- AI-assisted investigation workflows
- Demonstrating a multi-module search product

## Tech Stack

| Area | Tech |
| --- | --- |
| Frontend | React, TypeScript, Vite |
| Backend | Express, Node.js |
| Optional AI | Google Gemini |
| Optional Social Search | X/Twitter API |
| Deployment | Docker, Render, Vercel config included |

## Setup

```bash
git clone https://github.com/521w/sousou.git
cd sousou
cp .env.example .env
npm install
npm run dev
```

Optional environment variables:

```text
GEMINI_API_KEY=your_gemini_api_key
X_BEARER_TOKEN=your_x_bearer_token
HIBP_API_KEY=your_hibp_api_key
```

## Build

```bash
npm run build
npm start
```

## Verification

Validated on Termux / Node.js v22.22.0:

```bash
npm install
npm run lint
npm run build
```

Notes:

- `npm install` completed, with npm audit reporting 12 vulnerabilities from dependencies.
- `npm run lint` completed after fixing X/Twitter response typing in `server.ts`.
- `npm run build` completed with Vite.
- Vite reports a large bundle warning; this does not fail the build.

## Data Sources

- HIBP k-anonymity password API
- Optional HIBP breach API
- Gravatar
- ip-api.com
- RDAP endpoints
- Public web search dork generation
- Optional X/Twitter API
- Optional Gemini summary

## Safety Notes

- Use only for lawful, authorized, and defensive investigation.
- Some modules query public third-party services.
- Generated dorks are search suggestions, not proof of compromise.
- AI summaries are optional and should be treated as interpretation, not ground truth.

## License

MIT
