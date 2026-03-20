# Jingchu Song #2 — Tournament Platform

A full-stack web platform for **Jingchu Song #2** (荆楚歌 #2), an Arknights Integrated Strategies competitive tournament. Features a public-facing event website with real-time match tracking and an admin backend for scoring, compliance management, and team result publication.

## Screenshots

> _Coming soon_

## Architecture

```
Browser (React SPA)  ←→  Vite Dev Proxy (:3000)  ←→  Node.js API (:8787)
                                                          ↕
                                                   JSON File Store
                                              (server/data/*.json)
```

- **Frontend**: React 18, TypeScript, Tailwind CSS, GSAP animations, React Router v6
- **Backend**: Pure Node.js HTTP server (zero framework dependencies), ESM modules
- **Storage**: Atomic JSON file operations with write-ahead queuing

## Features

### Public Website
- **Home** — Event overview, prize pool, countdown, CTA links
- **Live** — Real-time broadcast status, match leaderboard, member run tracking
- **Teams** — Team profiles with radar charts, member rosters, and score breakdowns
- **Rules** — Full tournament rulebook with theme-specific scoring details

### Admin Backend
- RESTful API with token-based authentication
- Three-theme scoring engine (Sami / Sarkaz / Sui) with server-side score recalculation
- Team compliance tracking (pressure role, ingot spending, overtime, operator drafts, coach calls)
- Coefficient-based team aggregate scoring with automatic penalty computation
- Publish workflow with blocking-issue validation

### UI/UX
- GSAP-powered page transitions with SVG liquid-warp effects
- Parallax logo with reduced-motion and touch-device awareness
- Scroll-reveal animations via IntersectionObserver
- Spotlight cards with GPU-accelerated glow tracking
- Fully responsive dark theme with a curated gold-on-black palette

## Getting Started

### Prerequisites

- **Node.js** ≥ 18 (requires top-level `await` support)
- **npm** ≥ 8

### Install

```bash
git clone https://github.com/winiskey/arkpj1.git
cd arkpj1
npm install
```

### Development

```bash
# Start both frontend (port 3000) and backend (port 8787)
npm run dev:all

# Or start them separately
npm run dev   # Frontend only (proxies /api to :8787)
npm run api   # Backend only
```

### Build

```bash
npm run build     # TypeScript check + Vite production build → dist/
npm run preview   # Preview production build locally
```

### Content Sync

The frontend uses static content from `src/content/`. To export it to the backend data store:

```bash
npm run sync:content
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `API_HOST` | `127.0.0.1` | Backend listen address |
| `API_PORT` | `8787` | Backend listen port |
| `API_BODY_LIMIT_BYTES` | `1048576` | Max request body size (bytes) |
| `API_CORS_ORIGINS` | `""` | Allowed origins (comma-separated) |
| `ADMIN_TOKEN` | `""` | Admin API authentication token |

> ⚠️ In production, always set `ADMIN_TOKEN` to a non-empty secret value.

## Project Structure

```
├── src/                    # Frontend (React + TypeScript)
│   ├── components/         # UI components (19)
│   ├── pages/              # Page views (4)
│   ├── content/            # Static content & types
│   ├── context/            # React context (SiteDataContext)
│   └── lib/                # Shared hooks & utilities
│
├── server/                 # Backend (Node.js ESM)
│   ├── index.mjs           # Entry point
│   └── app/
│       ├── config.mjs      # Environment config
│       ├── create-server.mjs # HTTP server + route registration
│       ├── http.mjs        # HTTP utilities, CORS, auth
│       ├── service.mjs     # Business logic orchestration
│       ├── domain.mjs      # Domain models & aggregate logic
│       ├── scoring.mjs     # Three-theme scoring engine
│       ├── validators.mjs  # Input validation (639 lines)
│       └── json-file-store.mjs # Atomic JSON persistence
│
├── scripts/                # Dev & build scripts
└── public/                 # Static assets
```

## Scoring System

The tournament features three Arknights Integrated Strategies themes, each with its own scoring formula:

| Theme | Identifier | Final Multiplier |
|-------|-----------|-----------------|
| 探索者的银淞止境 (Sami) | `sami` | ×1.0 |
| 萨卡兹的无终奇语 (Sarkaz) | `sarkaz` | ×0.75 |
| 岁的界园志异 (Sui) | `sui` | ×0.4 ~ 0.64 (dynamic) |

**Team Total** = (Sum of 4 members' scores + Pressure Bonus) × Coefficient

The coefficient starts at 1.0 and is reduced by overtime penalties, duplicate 6★ operator usage, and excess ingot spending.

## Testing

```bash
# Run all backend tests (17 tests)
node --test server/app/scoring.test.mjs server/app/service.test.mjs server/app/rules-content.test.mjs

# Type check
npx tsc --noEmit
```

## API Overview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/health` | — | Health check |
| `GET` | `/api/public/bootstrap` | — | Full public data for frontend |
| `GET` | `/api/admin/ops/bootstrap` | ✅ | Admin dashboard data |
| `POST` | `/api/admin/score-sheets/upsert` | ✅ | Submit score (server recalculates) |
| `POST` | `/api/admin/teams/:id/publish` | ✅ | Publish team results |
| `PATCH` | `/api/admin/live-broadcast` | ✅ | Update broadcast status |

See [OPS_MANUAL.md](OPS_MANUAL.md) for the complete API reference and operations guide.

## License

Private project. All rights reserved.
