# Repository Guidelines

This document guides contributors working in this repository. It summarizes structure, commands, and conventions specific to this Next.js + TypeScript + Drizzle project.

## Project Structure & Modules
- App routes and pages: `src/app/`
- UI components and hooks: `src/components/`, `src/hooks/`
- Database layer: `src/db/` (Drizzle schema in `schema.ts`, seeds in `seeds/`)
- Server APIs (route handlers): `src/app/api/**/route.ts`
- Utilities: `src/lib/`
- Public assets: `public/`
- Migrations output: `drizzle/`
- Config: `next.config.ts`, `drizzle.config.ts`, `eslint.config.mjs`, `tsconfig.json`

## Build, Test, and Development
- `npm run dev` — Start Next.js dev server (Turbopack) at `localhost:3000`.
- `npm run build` — Production build.
- `npm start` — Start built app.
- `npm run lint` — Lint with ESLint (Next config).
- Database:
  - `npm run db:generate` — Generate Drizzle SQL from schema.
  - `npm run db:migrate` — Apply migrations (uses `DATABASE_URL`).
  - `npm run db:seed` — Seed local/dev data.
  - `npm run db:verify` — Verify seed/test data.

## Coding Style & Naming
- TypeScript, ES Modules; use explicit types for public functions.
- Indentation: 2 spaces; prefer small, focused modules.
- React: functional components, hooks-first; server components when possible.
- Naming: kebab-case for routes/paths, PascalCase for components, camelCase for vars/functions, snake_case for DB columns.
- Imports: relative within `src/` or configured aliases; keep import order clean.
- Linting: rules defined in `eslint.config.mjs` (import rules enforced; some TS rules relaxed).

## Testing Guidelines
- Frameworks referenced: Vitest for unit/API, Playwright for E2E (see `docs/DEVELOPMENT_WORKFLOW.md`).
- Place tests adjacent to code or under `docs` examples until a `tests/` folder is introduced.
- Suggested scripts (if added): `npm test`, `npm run test:watch`, `npm run test:coverage` using Vitest.
- Aim for meaningful coverage on route handlers and db utilities; mock external services.

## Commits & Pull Requests
- Commit style: Conventional Commits, e.g., `feat(spaces): create space API`.
- PRs must include: clear description, linked issue, test evidence (logs/screens), migration notes when DB changes, and any UI screenshots.
- Ensure: lints pass, app builds, migrations applied, and `.env.example` updated when adding env vars.

## Security & Configuration
- Never commit secrets. Use `.env.local`; mirror new keys in `.env.example`.
- Database URL required for Drizzle (`drizzle.config.ts`). Run generate/migrate before API work.
- Validate inputs in route handlers; return typed, explicit errors.

Agent-Specific: Follow this AGENTS.md for edits within the repo scope.

