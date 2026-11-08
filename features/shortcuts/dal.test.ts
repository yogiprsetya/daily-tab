import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/db';
import {
  createShortcut,
  listShortcuts,
  moveShortcut,
  removeShortcut,
  updateShortcut,
} from './dal';
import { shortcuts } from './schema';

const UNKNOWN = '6f1d2c3a-9b4e-4f7a-8c21-0d5e6f7a8b9c';

beforeEach(async () => {
  await db.execute(sql`truncate ${shortcuts}`);
});

function seed(title: string, position: number, createdAt = new Date()) {
  return db
    .insert(shortcuts)
    .values({ title, url: `https://${title}.example/`, position, createdAt });
}

const titles = async () => (await listShortcuts()).map((s) => s.title);

async function add(...names: string[]) {
  const rows = [];
  for (const title of names) {
    rows.push(
      await createShortcut({ title, url: `https://${title}.example/` })
    );
  }
  return rows;
}

describe('listShortcuts', () => {
  it('returns nothing for an empty table', async () => {
    expect(await listShortcuts()).toEqual([]);
  });

  it('orders by position', async () => {
    await seed('third', 3);
    await seed('first', 1);
    await seed('second', 2);

    expect(await titles()).toEqual(['first', 'second', 'third']);
  });

  it('breaks position ties by creation time', async () => {
    await seed('newer', 1, new Date('2026-11-08T10:00:00Z'));
    await seed('older', 1, new Date('2026-11-08T09:00:00Z'));

    expect(await titles()).toEqual(['older', 'newer']);
  });
});

describe('createShortcut', () => {
  it('appends after the current last position', async () => {
    await seed('existing', 7);

    const row = await createShortcut({
      title: 'new',
      url: 'https://new.example/',
    });

    expect(row.position).toBe(8);
    expect(await titles()).toEqual(['existing', 'new']);
  });

  it('starts at position 1 on an empty table', async () => {
    const [row] = await add('first');

    expect(row.position).toBe(1);
  });
});

describe('updateShortcut', () => {
  it('changes only the given field and bumps updatedAt', async () => {
    const [row] = await add('old');

    const updated = await updateShortcut(row.id, { title: 'new' });

    expect(updated).toMatchObject({ title: 'new', url: row.url });
    expect(updated!.updatedAt.getTime()).toBeGreaterThanOrEqual(
      row.updatedAt.getTime()
    );
  });

  it('returns null for an unknown id', async () => {
    expect(await updateShortcut(UNKNOWN, { title: 'x' })).toBeNull();
  });
});

describe('removeShortcut', () => {
  it('deletes the row', async () => {
    const [row] = await add('gone');

    expect(await removeShortcut(row.id)).toBe(true);
    expect(await titles()).toEqual([]);
  });

  it('returns false for an unknown id', async () => {
    expect(await removeShortcut(UNKNOWN)).toBe(false);
  });
});

describe('moveShortcut', () => {
  it('moves an item earlier', async () => {
    const [, b] = await add('a', 'b', 'c');

    await moveShortcut(b.id, 'up');

    expect(await titles()).toEqual(['b', 'a', 'c']);
  });

  it('moves an item later', async () => {
    const [, b] = await add('a', 'b', 'c');

    await moveShortcut(b.id, 'down');

    expect(await titles()).toEqual(['a', 'c', 'b']);
  });

  it('is a no-op at the first position', async () => {
    const [a] = await add('a', 'b');

    expect(await moveShortcut(a.id, 'up')).toBe(true);
    expect(await titles()).toEqual(['a', 'b']);
  });

  it('is a no-op at the last position', async () => {
    const [, b] = await add('a', 'b');

    expect(await moveShortcut(b.id, 'down')).toBe(true);
    expect(await titles()).toEqual(['a', 'b']);
  });

  it('still moves items that share a position', async () => {
    await seed('a', 1, new Date('2026-11-08T09:00:00Z'));
    await seed('b', 1, new Date('2026-11-08T10:00:00Z'));
    const b = (await listShortcuts())[1];

    await moveShortcut(b.id, 'up');

    expect(await titles()).toEqual(['b', 'a']);
  });

  it('returns false for an unknown id', async () => {
    expect(await moveShortcut(UNKNOWN, 'up')).toBe(false);
  });
});
