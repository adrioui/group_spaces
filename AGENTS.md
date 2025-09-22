# Group Spaces — AGENTS.md

This file orients AI coding agents to work effectively in this Next.js + TypeScript + Drizzle repository. Keep changes precise, follow conventions, and use the exact commands below.

## Overview
- Framework: Next.js App Router (TypeScript, ES Modules)
- Data: PostgreSQL via Drizzle ORM (SQL generated with drizzle-kit)
- Auth: better-auth (OTP; Twilio optional for dev; required for prod)
- Tests: Vitest (unit/integration), Playwright (E2E)
- Middleware: `middleware.ts` for auth/session

## Architecture
- App routes/pages: `src/app/`
- APIs (route handlers): `src/app/api/**/route.ts`
- UI components/hooks: `src/components/`, `src/hooks/`
- Database: `src/db/` (schema, seed/verify scripts)
- Utilities: `src/lib/`
- Public assets: `public/`
- Migrations output (generated): `drizzle/`
- Config: `next.config.ts`, `drizzle.config.ts`, `eslint.config.mjs`, `tsconfig.json`

## Build & Test
- Dev server: `npm run dev`
- Build: `npm run build`
- Start built app: `npm start`
- Lint: `npm run lint`
- Unit/Integration tests: `npm run test`
- Watch tests: `npm run test:watch`
- Coverage: `npm run test:coverage`
- E2E tests: `npm run test:e2e`
- E2E UI: `npm run test:e2e:ui`
- E2E headed: `npm run test:e2e:headed`
- All tests (unit + e2e): `npm run test:all`
- PGlite tests (fast): `npm run test:pglite`, `npm run test:pglite:watch`, `npm run test:e2e:pglite`
- Database codegen: `npm run db:generate`
- Database migrate: `npm run db:migrate`
- Seed dev data: `npm run db:seed`
- Verify test data: `npm run db:verify`
- Local Postgres setup: `npm run db:setup`
- Cleanup test DB: `npm run db:cleanup`
- Reset DB: `npm run db:reset`
- Test DB migrate/seed: `npm run db:test:migrate`, `npm run db:test:seed`

## Development Environment
- Node.js: 20+ (npm as package manager)
- Install deps: `npm ci` (or `npm install`)
- Start dev: `npm run dev` then open `http://localhost:3000`
- Env files: use `.env.local` (never commit secrets); mirror keys in `.env.example`
- Database (local): run `npm run db:setup` then `npm run db:migrate`
- Database (tests): by default uses `.env.test`; set `TEST_DB=pglite` for PGlite

Required env vars (see `.env.example`):
- `DATABASE_URL`, `DATABASE_URL_TEST`
- `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_BETTER_AUTH_URL`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` (prod)
- `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `TEST_DB`, `PGLITE_PERSIST`, `PGLITE_DATA_DIR`, `PGLITE_VERBOSE`, `PGLITE_ISOLATION`

## Project Layout
├─ `src/app/` → routes, server components, API routes
├─ `src/components/`, `src/hooks/` → UI + hooks (client as needed)
├─ `src/db/` → Drizzle schema + seed/verify
├─ `src/lib/` → utilities, helpers
├─ `drizzle/` → generated migrations (read-only)
├─ `docs/` → architecture, testing, deployment
├─ `public/` → static assets
└─ `scripts/` → DB setup/cleanup

## Conventions & Patterns
- Components: React functional; prefer server components; add `"use client"` only when needed.
- State/data: use hooks-first patterns; fetch in server where possible.
- Validation: use `zod` for request/params validation in route handlers.
- Error handling: return typed, explicit errors; avoid generic `Error`.
- Imports: keep order clean; use relative paths within `src/` or configured aliases.
- Naming: kebab-case routes/paths; PascalCase components/types; camelCase vars/functions; snake_case DB columns.
- Modules: small, focused; 2-space indentation.

## Coding Style
- Language: TypeScript + ES Modules.
- Linting: `eslint.config.mjs` (Next rules; import rules enforced; some TS rules relaxed).
- Types: explicit types for public functions and API responses.
- No `@ts-ignore` in production code; prefer proper types or narrow casts.

## Testing Instructions
- Frameworks: Vitest (unit/integration), Playwright (E2E).
- Location: tests live adjacent to code or under `src/tests/`.
- Run unit/integration: `npm run test` (loads `.env.test`).
- E2E: `npm run test:e2e` (Playwright). Use `:ui` or `:headed` when debugging.
- PGlite: set `TEST_DB=pglite` or use `npm run test:pglite*` for faster runs.
- Targets: prioritize route handlers, DB utilities, and auth flows; mock external services (Twilio, Supabase).
- Coverage: use `npm run test:coverage` and aim for 80%+ on changed areas.

## Git Workflows
- Branches: `feature/<desc>`, `fix/<desc>`, `chore/<desc>`.
- Commits: Conventional Commits, e.g., `feat(spaces): create space API`.
- Before commit/PR: `npm run lint` && `npm run build` && `npm run test`.
- PRs must include: clear description, linked issue, test evidence (logs/screens), migration notes when DB changes, UI screenshots as relevant.
- Keep `.env.example` updated when adding env vars.

## Security
- Never commit secrets; use environment variables and `.env.local`.
- Sanitize and validate all inputs; enforce authentication on API endpoints.
- Never log sensitive data (passwords, tokens, PII).
- Database access only through Drizzle; avoid raw SQL in app code.

## File Boundaries
- DO edit: `src/`, `docs/`, `scripts/`, `drizzle.config.ts`, `eslint.config.mjs`, `tsconfig.json`.
- READ-ONLY (generated): `drizzle/` migrations — create via `drizzle-kit`, do not hand-edit.
- DO NOT edit: `node_modules/`, `.next/`, `.env*` (except local dev files), `package-lock.json` manually.

## CRITICAL RULES
- NEVER modify `node_modules/`, `.next/`, or generated files under `drizzle/` by hand.
- NEVER commit secrets or test credentials.
- ALWAYS run `npm run test` and `npm run lint` before submitting PRs.
- MUST include input validation and error handling for all API routes.
- Database migrations require review alongside schema changes.

## References
- Architecture: @docs/PROJECT_OVERVIEW.md
- Development workflow: @docs/DEVELOPMENT_WORKFLOW.md
- Testing: @docs/COMPREHENSIVE_TEST_GUIDE.md, @docs/TESTING_VALIDATION.md, @docs/PGLITE_TESTING_GUIDE.md, @docs/LOCAL_POSTGRES_TESTING.md
- Deployment: @docs/DEPLOYMENT_GUIDE.md
- Edge auth/middleware: @docs/EDGE_MIDDLEWARE_AUTH_GUIDE.md

## Domain Concepts
- Space: collaborative grouping entity (core resource for features and membership).
- OTP Auth: one-time passcode login; Twilio used in production; in dev, codes are logged.
- Better Auth: authentication provider library configured via env vars in `.env.example`.

## Evidence Required for Every PR
A PR is reviewable when it includes:
- All tests green: `npm run test` (and `npm run test:e2e` if applicable)
- Lint passes: `npm run lint`
- App builds cleanly: `npm run build`
- Coverage maintained or improved: `npm run test:coverage`
- Proof artifact:
  - Bug fix → failing test added first, now passes
  - Feature → new tests demonstrating behavior
- One-paragraph description of intent and approach
- No unexplained new dependencies; env keys mirrored in `.env.example`
