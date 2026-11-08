import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/db';
import { listShortcuts } from './dal';
import { shortcuts } from './schema';

beforeEach(async () => {
  await db.execute(sql`truncate ${shortcuts}`);
});

function seed(title: string, position: number, createdAt = new Date()) {
  return db
    .insert(shortcuts)
    .values({ title, url: `https://${title}.example/`, position, createdAt });
}

describe('listShortcuts', () => {
  it('returns nothing for an empty table', async () => {
    expect(await listShortcuts()).toEqual([]);
  });

  it('orders by position', async () => {
    await seed('third', 3);
    await seed('first', 1);
    await seed('second', 2);

    expect((await listShortcuts()).map((s) => s.title)).toEqual([
      'first',
      'second',
      'third',
    ]);
  });

  it('breaks position ties by creation time', async () => {
    await seed('newer', 1, new Date('2026-11-08T10:00:00Z'));
    await seed('older', 1, new Date('2026-11-08T09:00:00Z'));

    expect((await listShortcuts()).map((s) => s.title)).toEqual([
      'older',
      'newer',
    ]);
  });
});
