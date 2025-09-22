// src/tests/pglite/utils.ts
import fs from 'node:fs'
import { resolve } from 'node:path'
import type { PGlite } from '@electric-sql/pglite'

export async function applyMigrations(pg: PGlite, opts: { verbose?: boolean } = {}) {
  const { verbose } = opts
  const dir = resolve(process.cwd(), 'drizzle')
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  await pg.exec(`create table if not exists _migrations (name text primary key)`)
  for (const file of files) {
    const applied = await pg.query(`select 1 from _migrations where name = '${file}'`)
    if (applied.rows.length) continue
    const sql = fs.readFileSync(resolve(dir, file), 'utf8')
    if (verbose) console.log('[pglite] applying', file)
    await pg.exec(sql)
    await pg.exec(`insert into _migrations(name) values ('${file}')`)
  }
}

export async function seedAll(db: any, opts: { verbose?: boolean } = {}) {
  const { verbose } = opts
  // Minimal deterministic seed for testing
  // Import schema to get table references
  const { users, spaces, spaceMembers } = await import('@/db/schema')

  try {
    // Insert test user
    await db.insert(users).values({
      id: 'test_user_1',
      email: 'test@example.com',
      name: 'Test User',
      emailVerified: true,
      phoneVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Insert test space (let serial ID auto-generate)
    const spaceInsert = await db.insert(spaces).values({
      ownerId: 'test_user_1',
      name: 'Test Space',
      slug: 'test-space',
      description: 'A test space for PGlite testing',
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning({ id: spaces.id })

    const spaceId = spaceInsert[0].id

    // Insert space membership
    await db.insert(spaceMembers).values({
      spaceId: spaceId,
      userId: 'test_user_1',
      role: 'owner',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    if (verbose) console.log('[pglite] seeds applied')
  } catch (error) {
    if (verbose) console.warn('[pglite] seed warning:', error)
    // Don't fail on seeding errors in tests - the data might already exist
  }
}