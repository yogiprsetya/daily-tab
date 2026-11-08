import 'server-only';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { getEnv } from '@/lib/env';

const globalForDb = globalThis as unknown as { sql?: postgres.Sql };

// `prepare: false` is required by Supabase's transaction pooler.
const sql =
  globalForDb.sql ??
  postgres(getEnv().DATABASE_URL, { prepare: false, max: 5 });

// Reuse one client across hot reloads in development.
if (process.env.NODE_ENV !== 'production') globalForDb.sql = sql;

export const db = drizzle(sql);
