import 'server-only';
import { asc } from 'drizzle-orm';
import { db } from '@/db';
import { shortcuts } from './schema';

export function listShortcuts() {
  return db
    .select()
    .from(shortcuts)
    .orderBy(asc(shortcuts.position), asc(shortcuts.createdAt));
}
