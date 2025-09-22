import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite'
import { PGlite } from '@electric-sql/pglite'
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
