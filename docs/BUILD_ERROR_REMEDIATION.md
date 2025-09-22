# Build Error Remediation: DB Export and PGlite Wiring

Context
- Next.js build fails with: “Parsing ecmascript source code failed … 'import' and 'export' cannot be used outside of module code” at `src/db/index.ts:19`.
- Import trace shows Edge Middleware → `src/lib/auth.ts` → `src/db/index.ts`.

Root Causes
- Invalid ESM pattern in `src/db/index.ts`:
  - `export` is used inside an `if` block and top‑level `await import(...)` occurs inside that block. ESM requires exports at top level.
- Wrong package referenced for PGlite in code (`@electric-sql/pglite` vs `pglite` used in our guides).
- Edge middleware imports server‑only code (`@/db`) transitively via `@/lib/auth`, which is not Edge‑safe.

Fix Plan (small, focused PRs)

PR 1 — Make `src/db/index.ts` valid ESM with a single top‑level export
- Goal: keep the env‑gated behavior but conform to ESM rules.
- Replace the file body with the snippet below. This uses static imports and exactly one top‑level export.

```ts
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite'
import { PGlite } from 'pglite'
import * as schema from './schema'

const isPglite = process.env.TEST_DB === 'pglite'

function makePgliteDb() {
  const persist = process.env.PGLITE_PERSIST || 'memory'
  const dataDir = process.env.PGLITE_DATA_DIR
  const store = persist === 'filesystem' && dataDir ? dataDir : undefined
  const pg = new PGlite(store)
  return drizzlePglite(pg, { schema })
}

function makePostgresDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set')
  }
  const client = postgres(process.env.DATABASE_URL, { prepare: false })
  return drizzlePg(client, { schema, logger: process.env.NODE_ENV === 'development' })
}

export const db = isPglite ? makePgliteDb() : makePostgresDb()
```

Notes
- This keeps dev/prod on Postgres. Tests opt into PGlite using `TEST_DB=pglite`.
- If importing `pglite` in prod builds is undesirable, keep this change only for test‑only entry points instead of `src/db/index.ts` (alternate approach). For now, the above is the minimal safe fix.

PR 2 — Align dependencies
- Add: `npm i -D pglite`.
- Remove any usage of `@electric-sql/pglite` unless explicitly required and compatible.

PR 3 — Make middleware Edge‑safe (separate concern)
- `middleware.ts` imports `@/lib/auth`, which imports `@/db`. Edge cannot import Node‑only DB clients.
- Replace DB‑backed session check with an Edge‑safe approach:
  - Option A: Call a Node runtime API route (e.g., `/api/auth/session`) with cookies/headers to validate session.
  - Option B: Parse a lightweight session cookie/token directly in middleware if supported by the auth library without DB I/O.
- See `docs/EDGE_MIDDLEWARE_AUTH_GUIDE.md` for code templates.

Verification
- Run: `npm run lint`, `npm run build`, `npm start`.
- Ensure build succeeds and app serves without DB export errors.
- If using PGlite for E2E, run with `TEST_DB=pglite` and confirm basic flows.

Definition of Done
- Build passes (no ESM parse error).
- Middleware does not import DB/Node‑only code in Edge runtime.
- Dev/prod unaffected; tests can opt into PGlite.

