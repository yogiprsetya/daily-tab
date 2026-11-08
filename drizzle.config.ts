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
  // The local Supabase instance is shared: only ever look at our schema,
  // and keep the migration journal inside it too.
  schemaFilter: ['daily_tab'],
  migrations: {
    schema: 'daily_tab',
    table: '__drizzle_migrations',
  },
  strict: true,
  verbose: true,
});
