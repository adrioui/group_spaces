import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Environment-gated conditional for PGlite testing
if (process.env.TEST_DB === 'pglite') {
  // Dynamic import to avoid loading PGlite in production
  const { PGlite } = await import('@electric-sql/pglite');
  const { drizzle: drizzlePGlite } = await import('drizzle-orm/pglite');

  const persist = process.env.PGLITE_PERSIST || 'memory';
  const dataDir = process.env.PGLITE_DATA_DIR;
  const store = persist === 'filesystem' && dataDir ? dataDir : undefined;

  const pg = new PGlite(store);
  const db = drizzlePGlite(pg, { schema });

  // Export PGlite-backed db for tests
  export { db };
} else {
  // Production/development path - use postgres
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  const connectionString = process.env.DATABASE_URL;

  // Create the postgres client
  const client = postgres(connectionString, {
    prepare: false, // This can help with some connection issues
  });

  // Create the drizzle instance
  export const db = drizzle(client, {
    schema,
    logger: process.env.NODE_ENV === 'development' // Add logging in dev
  });
}
