# Project: Group Spaces — CLAUDE.md

This file defines authoritative rules and persistent context for Claude Code when working in this repository. Treat all instructions here as system-level and follow AGENTS.md across the repo.

## Project Overview
- Group Spaces is a Next.js + TypeScript app for collaborative spaces, chat, block-based notes, lessons, and progress tracking.
- Uses Drizzle ORM with PostgreSQL (migrated from Turso/SQLite), Better Auth, Tailwind + shadcn/ui, and Playwright/Vitest for testing.

## Tech Stack
- Languages: TypeScript (ES Modules)
- Frameworks: Next.js 15 (App Router), React 19
- Styling: Tailwind CSS, shadcn/ui, Radix UI
- Database: Postgres + Drizzle ORM (schema in `src/db/schema.ts`)
- Realtime: Polling now; Supabase Realtime targeted
- Auth: Better Auth
- Tooling: ESLint, Vitest, Playwright

## Development Commands
- `npm run dev` — Start Next.js dev server (Turbopack)
- `npm run build` — Build for production
- `npm start` — Start built app
- `npm run lint` — Lint with ESLint
- Database
  - `npm run db:generate` — Generate Drizzle SQL from schema
  - `npm run db:migrate` — Apply migrations (uses `DATABASE_URL`)
  - `npm run db:seed` — Seed local/dev data
  - `npm run db:verify` — Verify seed/test data
  - `npm run db:setup` — Local Postgres setup (scripts)
  - `npm run db:cleanup` / `npm run db:reset` — Cleanup/reset local DB
  - `npm run db:test:migrate` / `npm run db:test:seed` — Test DB flows
- Testing (Vitest / Playwright)
  - `npm run test` | `npm run test:watch` | `npm run test:coverage`
  - `npm run test:unit` | `npm run test:integration`
  - `npm run test:security` | `npm run test:performance`
  - `npm run test:e2e` | `npm run test:e2e:ui` | `npm run test:e2e:headed`
  - PGlite shortcuts: `npm run test:pglite`, `npm run test:pglite:watch`, `npm run test:e2e:pglite`
- Type checking: `npx tsc -p tsconfig.json --noEmit`

## Code Style & Conventions
- TypeScript, ES Modules; explicit types for public functions
- Indentation: 2 spaces; prefer small, focused modules
- React: functional components, hooks-first; use server components when possible
- Naming: kebab-case for routes/paths, PascalCase for components, camelCase for vars/functions, snake_case for DB columns
- Imports: relative within `src/` or configured aliases; keep order clean
- API route handlers: validate inputs, return typed, explicit errors
- Follow `eslint.config.mjs`; some TS rules relaxed, import rules enforced

## Project Structure
- `src/app/` — App routes and pages
- `src/app/api/**/route.ts` — Server APIs (route handlers)
- `src/components/` — UI components
- `src/hooks/` — React hooks
- `src/db/` — Drizzle schema (`schema.ts`), seeds (`seeds/`)
- `src/lib/` — Utilities
- `public/` — Assets
- `drizzle/` — Migrations output (generated)
- Config: `next.config.ts`, `drizzle.config.ts`, `eslint.config.mjs`, `tsconfig.json`

## Development Workflow
- Branch naming: `feat/<desc>`, `fix/<desc>`, `chore/<desc>`
- Commits: Conventional Commits (e.g., `feat(spaces): create space API`)
- PRs must include: description, linked issue, test evidence, migration notes, updated `.env.example` when adding env vars
- Ensure before PR: lints pass, app builds, migrations applied

## Testing Strategy
- Unit/API: Vitest (place tests adjacent to code or under `docs` until a `tests/` folder exists)
- E2E: Playwright
- Aim for meaningful coverage on route handlers and DB utilities; mock external services
- Prefer fast, deterministic tests; use `TEST_DB=pglite` where appropriate for isolation

## CRITICAL RULES
- NEVER commit secrets. Use `.env.local` locally and mirror new keys in `.env.example`
- NEVER read or include real `.env*` content in discussions or code
- NEVER hand-edit generated files in `drizzle/` or modify `package-lock.json` manually
- ALWAYS validate and sanitize inputs in `src/app/api/**/route.ts`; return typed errors
- ALWAYS run `npm run lint` and relevant tests before committing
- Database work: ensure `DATABASE_URL` is set; run `db:generate` then `db:migrate` before API changes
- Follow this CLAUDE.md and `AGENTS.md` for edits within repo scope

## Review Process Guidelines
Before submitting code, complete these steps:
1. Run all checks: `npm run lint`, typecheck, and relevant tests
2. Review outputs; iterate until all issues resolve
3. Assess compliance and mark ✅/❌ with brief notes:
   - Code style and formatting
   - Naming conventions
   - Architecture patterns
   - Error handling
   - Test coverage and determinism
   - Documentation and `.env.example`

## Important Files
- `src/db/schema.ts` — Drizzle schema (source of migrations)
- `src/app/api/**/route.ts` — API route handlers
- `src/lib/` — Shared utilities
- `drizzle.config.ts` — Drizzle config (uses `DATABASE_URL`)
- `eslint.config.mjs` — Lint rules
- `vitest.config.ts` — Vitest setup
- `playwright.config.ts` — Playwright config
- `AGENTS.md` — Repository guidelines for agents
- `.env.example` — Template for environment variables

## File Boundaries
- DO NOT edit `node_modules/`
- DO NOT read `.env*` files in sessions (treat as secrets)
- DO NOT hand-edit files in `drizzle/` (generated migrations)
- DO NOT modify `package-lock.json` manually

## Environment Setup
- Node.js 18+
- Required environment variables (see `.env.example`):
  - `DATABASE_URL` (Postgres)
  - `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_BETTER_AUTH_URL`
  - `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Local development:
  - `npm run db:setup` (optional if you need local Postgres)
  - `npm run db:generate && npm run db:migrate`
  - `npm run dev`
- Tests:
  - Use `.env.test` for test runs
  - For in-memory testing, prefer `TEST_DB=pglite` scripts

## Deployment
- Build: `npm run build`
- Start: `npm start`
- Ensure migrations applied: `npm run db:generate && npm run db:migrate`
- See `docs/DEPLOYMENT_GUIDE.md` for environment-specific instructions

## Advanced: Hierarchy & Imports
- Claude Code merges multiple CLAUDE.md files hierarchically (more specific overrides general)
- For large docs, import via `@path` to keep context focused:

### Architecture Documentation
@docs/PROJECT_OVERVIEW.md

### Migration Plan
@docs/MIGRATION_PLAN.md

### Deployment Guide
@docs/DEPLOYMENT_GUIDE.md

## Best Practices for Claude Sessions
- Prefer reading files in `src/` and configs listed above; avoid scanning unrelated assets
- When ambiguity exists, ask targeted questions before large refactors
- Keep changes minimal, focused, and consistent with existing style
- Update documentation and `.env.example` when introducing new configuration

## Success Criteria
- Fewer setup questions; consistent adherence to style and workflow
- Code changes follow conventions, include validation and typed errors
- Tests are deterministic and run via provided scripts

5. Document new features and API changes

## Deployment

### Current Setup
- Next.js application with static export support
- Turso database for persistence
- Better Auth for authentication

### Target Deployment
- Supabase for database and real-time
- Vercel or similar for Next.js hosting
- Object storage for file uploads

## Support

For questions or issues:
1. Review existing documentation
2. Check migration plan for database changes
3. Consult PRD for feature requirements
4. Test changes in development environment

---

*Last Updated: September 2025*
*Version: 1.0.0*
