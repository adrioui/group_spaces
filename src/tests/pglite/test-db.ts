// src/tests/pglite/test-db.ts
import fs from 'node:fs'
import { resolve } from 'node:path'
import { drizzle } from 'drizzle-orm/pglite'
import { PGlite } from '@electric-sql/pglite'
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