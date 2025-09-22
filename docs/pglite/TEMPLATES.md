# PGlite Integration — Code Templates

These templates are copy-ready starting points for Claude Code to implement PGlite support. Adjust paths and types as needed for this repo.

Template 1 — Vitest global setup (src/tests/pglite/setup-global.ts)
```ts
// src/tests/pglite/setup-global.ts
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import fs from 'node:fs'
import { PGlite } from 'pglite'
import { drizzle } from 'drizzle-orm/pglite'
import * as schema from '@/db/schema'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

declare global {
  // eslint-disable-next-line no-var
  var __PGLITE__: {
    pg: PGlite
    close?: () => Promise<void> | void
  } | undefined
}

export default async function setup() {
  process.env.NODE_ENV = process.env.NODE_ENV || 'test'
  process.env.TEST_DB = 'pglite'

  const persist = (process.env.PGLITE_PERSIST || 'memory') as 'memory' | 'filesystem'
  const isolation = (process.env.PGLITE_ISOLATION || 'run') as 'run' | 'worker'
  const verbose = process.env.PGLITE_VERBOSE === '1'

  const baseDir = process.cwd()
  const dataDir = process.env.PGLITE_DATA_DIR || resolve(baseDir, '.pglite')

  let store: string | undefined
  if (persist === 'filesystem') {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
    const suffix = isolation === 'worker' && process.env.VITEST_WORKER_ID ? `-${process.env.VITEST_WORKER_ID}` : ''
    store = resolve(dataDir, `db${suffix}`)
  }

  const pg = new PGlite(store)
  const db = drizzle(pg, { schema })

  if (verbose) console.log('[pglite] init', { persist, store })

  // Apply migrations
  await applyMigrations(pg, { verbose })

  // Seed minimal data
  await seedAll(db, { verbose })

  global.__PGLITE__ = { pg, close: () => pg.close?.() }
}

// Lightweight versions; replace with utils.ts imports in final PR
async function applyMigrations(pg: PGlite, opts: { verbose?: boolean } = {}) {
  const { verbose } = opts
  const dir = resolve(process.cwd(), 'drizzle')
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  await pg.exec(`create table if not exists _migrations (name text primary key)`)
  for (const file of files) {
    const applied = await pg.query(`select 1 from _migrations where name = $1`, [file])
    if (applied.rows.length) continue
    const sql = fs.readFileSync(resolve(dir, file), 'utf8')
    if (verbose) console.log('[pglite] applying', file)
    await pg.exec(sql)
    await pg.exec(`insert into _migrations(name) values ($1)`, [file])
  }
}

async function seedAll(db: ReturnType<typeof drizzle>, opts: { verbose?: boolean } = {}) {
  const { verbose } = opts
  // Minimal deterministic seed example — replace with real seeds or reuse src/db/seeds
  const { users } = await import('@/db/schema')
  await db.insert(users).values({
    authProviderId: 'auth_test_user_1',
    email: 'test@example.com',
    name: 'Test User',
    avatarUrl: null,
    bio: 'PGlite test user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
  if (verbose) console.log('[pglite] seeds applied')
}
```

Template 2 — PGlite-backed test DB (src/tests/pglite/test-db.ts)
```ts
// src/tests/pglite/test-db.ts
import fs from 'node:fs'
import { resolve } from 'node:path'
import { drizzle } from 'drizzle-orm/pglite'
import { PGlite } from 'pglite'
import * as schema from '@/db/schema'

const persist = (process.env.PGLITE_PERSIST || 'memory') as 'memory' | 'filesystem'
const isolation = (process.env.PGLITE_ISOLATION || 'run') as 'run' | 'worker'
const baseDir = process.cwd()
const dataDir = process.env.PGLITE_DATA_DIR || resolve(baseDir, '.pglite')

let store: string | undefined
if (persist === 'filesystem') {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  const suffix = isolation === 'worker' && process.env.VITEST_WORKER_ID ? `-${process.env.VITEST_WORKER_ID}` : ''
  store = resolve(dataDir, `db${suffix}`)
}

export const pg = new PGlite(store)
export const db = drizzle(pg, { schema })
```

Template 3 — Helpers (src/tests/pglite/utils.ts)
```ts
// src/tests/pglite/utils.ts
import fs from 'node:fs'
import { resolve } from 'node:path'
import type { PGlite } from 'pglite'
import type { DrizzleD1Database } from 'drizzle-orm/d1' // only for typedef placeholder if needed

export async function applyMigrations(pg: PGlite, opts: { verbose?: boolean } = {}) {
  const { verbose } = opts
  const dir = resolve(process.cwd(), 'drizzle')
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort()
  await pg.exec(`create table if not exists _migrations (name text primary key)`)
  for (const file of files) {
    const applied = await pg.query(`select 1 from _migrations where name = $1`, [file])
    if (applied.rows.length) continue
    const sql = fs.readFileSync(resolve(dir, file), 'utf8')
    if (verbose) console.log('[pglite] applying', file)
    await pg.exec(sql)
    await pg.exec(`insert into _migrations(name) values ($1)`, [file])
  }
}

export async function seedAll(db: any, opts: { verbose?: boolean } = {}) {
  const { verbose } = opts
  // TODO: refactor src/db/seeds/* to export pure functions (accept db) and reuse here.
  if (verbose) console.log('[pglite] seedAll — implement minimal deterministic seeds here')
}
```

Template 4 — Env‑gated conditional (optional) in src/db/index.ts
```ts
// PSEUDOCODE — do not paste blindly. Wrap in a focused PR if E2E requires this path.
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

let db: ReturnType<typeof drizzlePg> | undefined
if (process.env.TEST_DB === 'pglite') {
  const { PGlite } = await import('pglite')
  const { drizzle } = await import('drizzle-orm/pglite')
  const pg = new PGlite(process.env.PGLITE_PERSIST === 'filesystem' ? process.env.PGLITE_DATA_DIR : undefined)
  db = drizzle(pg, { schema })
} else {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set')
  const client = postgres(process.env.DATABASE_URL, { prepare: false })
  db = drizzlePg(client, { schema, logger: process.env.NODE_ENV === 'development' })
}
export { db }
```

Template 5 — Package.json scripts (excerpt)
```json
{
  "scripts": {
    "test:pglite": "TEST_DB=pglite vitest",
    "test:pglite:watch": "TEST_DB=pglite vitest --watch",
    "test:e2e:pglite": "TEST_DB=pglite playwright test"
  }
}
```

Template 6 — Playwright PGlite global setup (playwright.pglite.global-setup.ts)
```ts
// playwright.pglite.global-setup.ts
import type { FullConfig } from '@playwright/test'
import { PGlite } from 'pglite'
import { drizzle } from 'drizzle-orm/pglite'
import * as schema from '@/db/schema'
import fs from 'node:fs'
import { resolve } from 'node:path'

async function applyMigrations(pg: PGlite) {
  const dir = resolve(process.cwd(), 'drizzle')
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()
  await pg.exec(`create table if not exists _migrations (name text primary key)`)
  for (const file of files) {
    const applied = await pg.query(`select 1 from _migrations where name = $1`, [file])
    if (applied.rows.length) continue
    const sql = fs.readFileSync(resolve(dir, file), 'utf8')
    await pg.exec(sql)
    await pg.exec(`insert into _migrations(name) values ($1)`, [file])
  }
}

export default async function globalSetup(_config: FullConfig) {
  process.env.NODE_ENV = 'test'
  process.env.TEST_DB = 'pglite'
  const pg = new PGlite()
  const db = drizzle(pg, { schema })
  await applyMigrations(pg)
  // TODO: seed minimal rows as needed for E2E
}
```

Notes
- Keep templates minimal; wire real logging and error handling as needed.
- Prefer pure seed functions that accept a `db` instance for reuse across environments.
- Use env gating to prevent production behavior changes.

