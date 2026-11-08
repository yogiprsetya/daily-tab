import { loadEnvConfig } from '@next/env';
import { defineConfig } from 'drizzle-kit';
import { parseEnv } from './lib/env';

// Load .env / .env.local the same way `next dev` does.
loadEnvConfig(process.cwd());
const env = parseEnv(process.env);

export default defineConfig({
  dialect: 'postgresql',
  schema: ['./db/schema.ts', './features/*/schema.ts'],
  out: './drizzle',
  dbCredentials: {
    url: env.DATABASE_URL_MIGRATE ?? env.DATABASE_URL,
  },
  // The Supabase instance is shared: only ever diff our own schema.
  schemaFilter: ['daily_tab'],
  // Journal lives next to other projects' journals (e.g. drizzle.lontu_migrations),
  // under a name that cannot collide with them.
  migrations: {
    schema: 'drizzle',
    table: 'daily_tab_migration',
  },
  strict: true,
  verbose: true,
});
