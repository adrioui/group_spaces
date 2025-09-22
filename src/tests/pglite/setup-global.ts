// src/tests/pglite/setup-global.ts
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import fs from 'node:fs'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import * as schema from '@/db/schema'
import { applyMigrations, seedAll } from './utils'

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