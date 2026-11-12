import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { asc, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { shortcuts } from './schema';

const ORDER = [asc(shortcuts.position), asc(shortcuts.createdAt)];

export async function listShortcuts() {
  'use cache';
  cacheLife('max');
  cacheTag('data:shortcuts');
  return await db
    .select()
    .from(shortcuts)
    .orderBy(...ORDER);
}

export async function createShortcut(input: { title: string; url: string }) {
  const [row] = await db
    .insert(shortcuts)
    .values({
      ...input,
      position: sql`(select coalesce(max(position), 0) + 1 from ${shortcuts})`,
    })
    .returning();
  return row;
}

export async function updateShortcut(
  id: string,
  patch: { title?: string; url?: string }
) {
  const [row] = await db
    .update(shortcuts)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(shortcuts.id, id))
    .returning();
  return row ?? null;
}

export async function removeShortcut(id: string): Promise<boolean> {
  const rows = await db
    .delete(shortcuts)
    .where(eq(shortcuts.id, id))
    .returning({ id: shortcuts.id });
  return rows.length > 0;
}

/**
 * Swaps with the neighbour, renumbering 1..n so that rows sharing a position
 * can still move. Returns false for an unknown id; at either end it is a no-op.
 */
export async function moveShortcut(
  id: string,
  direction: 'up' | 'down'
): Promise<boolean> {
  return db.transaction(async (tx) => {
    const order = await tx
      .select({ id: shortcuts.id, position: shortcuts.position })
      .from(shortcuts)
      .orderBy(...ORDER)
      .for('update');

    const from = order.findIndex((row) => row.id === id);
    if (from === -1) return false;

    const to = from + (direction === 'up' ? -1 : 1);
    if (to < 0 || to >= order.length) return true;

    [order[from], order[to]] = [order[to], order[from]];
    for (const [index, row] of order.entries()) {
      if (row.position === index + 1) continue;
      await tx
        .update(shortcuts)
        .set({ position: index + 1 })
        .where(eq(shortcuts.id, row.id));
    }
    return true;
  });
}
