# Repository Guidelines

## Project Structure & Module Organization
`src/` contains the React SPA: `components/`, `pages/`, `pages/admin/`, `context/`, `content/`, `lib/`, and `styles.css`. `server/` contains the Node ESM backend; `server/app/` holds HTTP, scoring, validation, service, and WebSocket modules, while `server/data/` stores JSON runtime state. `public/` contains static assets, `docs/` and `deploy/ubuntu/` cover operations, and `dist/` is generated output. Do not hand-edit `dist/` or `node_modules/`.

## Build, Test, and Development Commands
`npm run dev` starts the Vite frontend with API proxying.
`npm run api` runs the backend from `server/index.mjs`.
`npm run dev:all` starts both services for local development.
`npm run build` runs `tsc --noEmit` and then builds `dist/`.
`npm run preview` serves the production bundle locally.
`npm run sync:content` and `npm run sync:operators` refresh backend/admin data from source files.

## Coding Style & Naming Conventions
Use 2-space indentation, double quotes, trailing commas, and ESM imports. TypeScript is `strict`; keep new frontend code fully typed and prefer named exports. React components and page files use PascalCase, for example `ScoreManagement.tsx`; hooks, helpers, and config modules use camelCase, for example `useAdminApi.ts`. Keep backend modules in `.mjs` and match existing Tailwind-first styling before adding new CSS to `src/styles.css`.

## Testing Guidelines
Backend tests use Node’s built-in `node:test` and live beside the code as `*.test.mjs` in `server/app/`. Run `node --test server/app/*.test.mjs` before submitting backend changes. There is no frontend test suite in this snapshot, so validate UI and admin flows with `npm run dev:all` and confirm `npm run build` succeeds. Add or update tests whenever scoring, service, validation, or WebSocket behavior changes.

## Commit & Pull Request Guidelines
This export does not include `.git` history, so project-specific commit patterns cannot be verified. Use short imperative commits, ideally Conventional Commit style such as `feat(admin): add finals validation`. Pull requests should explain user-facing changes, note any updates to `server/data/` or env vars, list commands run, and include screenshots for UI changes. Link the related issue or task when available.

## Security & Configuration Tips
Keep `ADMIN_TOKEN` and deploy secrets out of commits; treat the checked-in `.env` as local-only development scaffolding. Production deployment is driven by `.github/workflows/deploy.yml` and `deploy/ubuntu/`, so document any changes to ports, health checks, or server paths in the PR.
