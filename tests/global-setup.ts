import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

/** Brings the test database up to the latest migration before any test runs. */
export default async function setup() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error('TEST_DATABASE_URL is not set');

  const sql = postgres(url, { max: 1, onnotice: () => {} });
  try {
    await migrate(drizzle(sql), {
      migrationsFolder: 'drizzle',
      migrationsSchema: 'drizzle',
      migrationsTable: 'daily_tab_migration',
    });
  } finally {
    await sql.end();
  }
}
