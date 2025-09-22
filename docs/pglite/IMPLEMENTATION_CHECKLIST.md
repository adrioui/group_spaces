# PGlite Integration — Implementation Checklist (for Claude Code)

This checklist turns the PGlite integration into small, verifiable PRs. Keep production behavior unchanged; everything is test-only and gated by env vars. See `docs/PGLITE_TESTING_GUIDE.md` for context and decisions.

Principles (Claude Code best practices)
- Plan first: write a short PR plan, expected changes, and validation.
- Ship small diffs: one logical change per PR; avoid mixed refactors.
- Prefer env-gated switches over invasive edits to app code.
- Add steps to reproduce and screenshots/logs in PR descriptions.
- Keep docs and scripts in sync with code.

Pre‑flight
- Ensure migrations are current: `npm run db:generate` (no-op expected).
- Verify local Postgres tests still run: `npm run test`.

Phase 1 — Dependencies and scaffolding
1) Add dev dependency
   - Command: `npm i -D pglite`
   - Verify: `node -e "require('pglite')"` exits 0.
2) Scaffolding
   - Create `src/tests/pglite/` with placeholder files: `setup-global.ts`, `test-db.ts`, `utils.ts`.
   - Verify: `tsc -p tsconfig.json` compiles.

Phase 2 — Vitest PGlite client and setup
3) Implement `src/tests/pglite/test-db.ts`
   - Create a PGlite instance (memory default; filesystem via `PGLITE_PERSIST=filesystem` and `PGLITE_DATA_DIR`).
   - Export Drizzle client from `drizzle-orm/pglite` with `@/db/schema`.
   - Isolation: when `PGLITE_ISOLATION=worker`, derive unique store names using `process.env.VITEST_WORKER_ID`.
   - Verify: `tsc` compiles; import/export types OK.
4) Implement `src/tests/pglite/utils.ts`
   - `applyMigrations(pg)`: read and apply `drizzle/*.sql` in order; maintain a migrations ledger table; log when `PGLITE_VERBOSE=1`.
   - `seedAll(db)`: insert minimal deterministic rows; reuse `src/db/seeds/*` later when refactored.
   - Verify: a tiny Vitest spec can run these without failures.
5) Implement `src/tests/pglite/setup-global.ts`
   - Set `process.env.TEST_DB='pglite'` and respect `PGLITE_*` envs.
   - Start PGlite, run migrations and seeds; stash handles on `globalThis` for teardown if needed.
   - Verify: `TEST_DB=pglite vitest --passWithNoTests` runs setup successfully.
6) Wire `vitest.config.ts`
   - Conditionally add `globalSetup: 'src/tests/pglite/setup-global.ts'` when `process.env.TEST_DB==='pglite'`.
   - Verify: `TEST_DB=pglite npm run test` executes the global setup.

Phase 3 — Point DB-using tests at PGlite
7) Update test imports
   - Where tests import `@/db`, switch to `src/tests/pglite/test-db` for PGlite-only suites.
   - Consider a small helper to centralize this switch to minimize churn.
   - Verify: selected unit/integration specs pass with PGlite.

Phase 4 — Optional seed refactor for reuse
8) Make seed modules pure
   - In `src/db/seeds/*`, export pure functions accepting a `db` arg; avoid importing `@/db` internally.
   - Keep CLI entries by delegating to these functions with the prod `db`.
   - Update `seedAll(db)` to reuse them.
   - Verify: `npm run db:seed` and PGlite `seedAll` both succeed.

Phase 5 — Playwright (E2E) wiring
9) Add `playwright.pglite.global-setup.ts`
   - Mirror Vitest: set env, init PGlite, apply migrations, seed.
   - Verify: `TEST_DB=pglite npm run test:e2e` invokes setup.
10) Make app use PGlite in E2E
    - Option A (recommended): env-gate `src/db/index.ts` to construct PGlite-backed Drizzle when `TEST_DB==='pglite'`, bypassing `DATABASE_URL`.
    - Option B (advanced): alternate module resolution to swap `@/db`.
    - Verify: start app under `TEST_DB=pglite` and hit a simple API route in E2E.

Phase 6 — DX polish and CI
11) Scripts
    - Add: `test:pglite`, `test:pglite:watch`, `test:e2e:pglite`.
    - Verify: all run locally and pass.
12) Env and docs
    - Add to `.env.example`: `TEST_DB`, `PGLITE_PERSIST`, `PGLITE_DATA_DIR`, `PGLITE_VERBOSE`, `PGLITE_ISOLATION`.
    - Update README or link to `docs/PGLITE_TESTING_GUIDE.md`.
13) CI (optional first)
    - Add a matrix job for PGlite; allow-failure until stable.

Definition of Done
- Vitest: suites pass with `TEST_DB=pglite` and comparable or better runtime.
- Playwright: happy-path specs pass with `TEST_DB=pglite`.
- No dev/prod behavior change; everything is env-gated.
- Docs/scripts updated; contributors can run tests locally without Docker.

Verification commands
- Unit/Integration: `TEST_DB=pglite npm run test`
- Watch mode: `TEST_DB=pglite npm run test:pglite:watch`
- E2E: `TEST_DB=pglite npm run test:e2e:pglite`

