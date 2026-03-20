# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev:all      # Start frontend (:3000) + backend (:8787) together
npm run dev          # Frontend only (proxies /api/* to :8787)
npm run api          # Backend only

# Build & type check
npm run build        # tsc --noEmit + vite build → dist/
npx tsc --noEmit     # Type check only

# Tests (backend only, no test runner install needed)
node --test server/app/scoring.test.mjs server/app/service.test.mjs server/app/rules-content.test.mjs

# Content sync
npm run sync:content     # Export src/content/ → server/data/
npm run sync:operators   # Sync operator catalog
```

## Architecture

```
Browser (React SPA)  ←→  Vite Dev Proxy (:3000)  ←→  Node.js API (:8787)
                                                          ↕
                                                   JSON File Store
                                              (server/data/*.json)
```

**Frontend** (`src/`): React 18 + TypeScript + Tailwind CSS + GSAP + React Router v6. UI text is in Chinese (简体中文). All pages are lazy-loaded. `SiteDataContext` bootstraps data: it starts from static content in `src/content/` and attempts to upgrade to live API data from `/api/public/bootstrap` on mount. If the API is unavailable, the static fallback is used silently.

**Admin frontend** (`src/pages/admin/`): Protected by `ProtectedRoute` (checks `localStorage.adminToken`). Uses its own `AdminDataContext` for admin-specific state. Pages: Dashboard, ScoreManagement, TeamManagement, BroadcastControl, ScoreCalculator.

**Backend** (`server/`): Zero-dependency Node.js HTTP server (pure ESM). No framework. Routes are registered in `server/app/create-server.mjs`. All admin routes are wrapped with `withAdmin()` which calls `context.assertAdminAuth()` (Bearer token from `ADMIN_TOKEN` env var). Persistence is atomic JSON via `json-file-store.mjs` with a write-ahead queue. WebSocket support (`ws.mjs`) broadcasts live updates to connected clients; attached to the HTTP server in `createApp()`.

**Public API routes** (no auth): `GET /api/health`, `GET /api/public/bootstrap` (full public data), `GET /api/public/rule-config` (rule version + tournament config).

**Data flow for scoring**: Admin submits a score sheet → `service.mjs` calls `domain.mjs` to validate and upsert → `scoring.mjs` recalculates the theme score server-side → aggregate (team total) is recomputed via `buildTeamAggregate()` in `domain.mjs`.

## Key Architectural Patterns

**Static content as fallback**: `src/content/` holds TypeScript files (`site.ts`, `teams.ts`, `matches.ts`, etc.) that export typed static data. These are the source of truth for the frontend when the backend is offline. `npm run sync:content` pushes this data into `server/data/public-content.json`.

**Three-tier score sheet status**: `draft` → `final` → `published`. Publishing a team (`POST /api/admin/teams/:id/publish`) promotes all `final` sheets to `published` and writes computed scores back to the public content store. Publish is blocked if `blockingIssues` exist (missing pressure role, incomplete roster, coach call violations).

**Coefficient system**: Team total = (sum of member scores + pressure bonus) × coefficient. Coefficient starts at 1.0 and is reduced by overtime penalties (−0.05 per 20 min), duplicate 6★ operators (−0.1 each), and excess ingot spend (−0.01 per ingot over 200). All logic lives in `domain.mjs:buildCoefficientBreakdown()`.

**Theme codes**: `sami` | `sarkaz` | `sui`. Each member is assigned a theme; `inferThemeCodeFromLabel()` in `domain.mjs` maps Chinese theme names to codes. Score sheets are validated to match the member's assigned theme.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `API_PORT` | `8787` | Backend port |
| `API_HOST` | `127.0.0.1` | Backend bind address |
| `ADMIN_TOKEN` | `""` | Required for all `/api/admin/*` routes |
| `API_CORS_ORIGINS` | `""` | Comma-separated allowed origins |
| `API_BODY_LIMIT_BYTES` | `1048576` | Max request body |

Set these in `.env` (already gitignored). In production, `ADMIN_TOKEN` must be non-empty.

## Admin Routes (all require `Authorization: Bearer <ADMIN_TOKEN>`)

| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/ops/bootstrap` | Full admin dashboard data |
| GET | `/api/admin/calculator/bootstrap` | Calculator page data |
| POST | `/api/admin/calculator/solo` | Recalculate a single score |
| GET/PUT | `/api/admin/public-content` | Read / replace all public content |
| PATCH | `/api/admin/live-broadcast` | Update broadcast status |
| PATCH | `/api/admin/matches/:matchId` | Update match status/score |
| GET/PATCH | `/api/admin/teams/:teamId/compliance` | Read/write compliance data |
| GET | `/api/admin/teams/:teamId/aggregate` | Get team aggregate |
| POST | `/api/admin/teams/:teamId/publish` | Publish team results |
| GET | `/api/admin/score-sheets` | List score sheets (query filters: teamId, memberId, theme, status, matchId) |
| POST | `/api/admin/score-sheets/upsert` | Create or update a score sheet |
| PATCH | `/api/admin/score-sheets/:sheetId/status` | Promote sheet status |
| POST/DELETE | `/api/admin/teams/:teamId/operators` | Manage operator drafts |
| POST/DELETE | `/api/admin/teams/:teamId/members/:memberId/planned-picks` | Manage planned picks |
| POST/DELETE | `/api/admin/teams/:teamId/calls` | Manage coach calls |
