import { sql } from 'drizzle-orm';
import { connection } from 'next/server';
import { db } from '@/db';
import { json } from '@/lib/api';

export async function GET() {
  // Must never be prerendered: a cached "ok" would hide a dead database.
  await connection();

  try {
    await db.execute(sql`select 1`);
    return json({ status: 'ok', db: 'ok' });
  } catch {
    return json({ status: 'error', db: 'unreachable' }, { status: 503 });
  }
}
