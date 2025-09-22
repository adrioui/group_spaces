// playwright.pglite.global-setup.ts
import type { FullConfig } from '@playwright/test'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import * as schema from '@/db/schema'
import { applyMigrations, seedAll } from './src/tests/pglite/utils'

export default async function globalSetup(_config: FullConfig) {
  process.env.NODE_ENV = 'test'
  process.env.TEST_DB = 'pglite'

  const verbose = process.env.PGLITE_VERBOSE === '1'

  const pg = new PGlite()
  const db = drizzle(pg, { schema })

  if (verbose) console.log('[playwright-pglite] Setting up PGlite for E2E tests')

  // Apply migrations
  await applyMigrations(pg, { verbose })

  // Seed minimal data for E2E tests
  await seedAll(db, { verbose })

  if (verbose) console.log('[playwright-pglite] PGlite setup complete')
}