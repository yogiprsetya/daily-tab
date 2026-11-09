import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/db';
import {
  DuplicateReadingItemError,
  UnknownTopicError,
  countUnread,
  createReadingItem,
  listRead,
  listTopics,
  listUnread,
  removeReadingItem,
  resolveTopicFilter,
  unreadWithoutTopic,
  updateReadingItem,
} from './dal';
import { readingItems, readingTopics } from './schema';

const UNKNOWN = '6f1d2c3a-9b4e-4f7a-8c21-0d5e6f7a8b9c';
const ALL = { kind: 'all' } as const;
const at = (minute: number) => new Date(Date.UTC(2026, 10, 9, 9, minute));

beforeEach(async () => {
  await db.execute(sql`truncate ${readingItems}, ${readingTopics}`);
});

function seedTopic(name: string) {
  return db
    .insert(readingTopics)
    .values({ name })
    .returning()
    .then(([row]) => row);
}

function seed(
  title: string,
  minute: number,
  extra: { topicId?: string; readMinute?: number } = {}
) {
  return db
    .insert(readingItems)
    .values({
      title,
      url: `https://${title.replace(/\W/g, '')}.example/`,
      topicId: extra.topicId,
      createdAt: at(minute),
      readAt: extra.readMinute === undefined ? null : at(extra.readMinute),
    })
    .returning()
    .then(([row]) => row);
}

const titles = (rows: { title: string }[]) => rows.map((r) => r.title);

describe('listUnread', () => {
  it('lists oldest first with the topic name', async () => {
    const dev = await seedTopic('Dev');
    await seed('newer', 2);
    await seed('older', 1, { topicId: dev.id });

    const rows = await listUnread(ALL);

    expect(titles(rows)).toEqual(['older', 'newer']);
    expect(rows[0].topicName).toBe('Dev');
    expect(rows[1].topicName).toBeNull();
  });

  it('leaves out read items', async () => {
    await seed('read', 1, { readMinute: 5 });
    await seed('unread', 2);

    expect(titles(await listUnread(ALL))).toEqual(['unread']);
  });

  it('filters by topic and by none', async () => {
    const dev = await seedTopic('Dev');
    await seed('in', 1, { topicId: dev.id });
    await seed('loose', 2);

    expect(titles(await listUnread({ kind: 'topic', id: dev.id }))).toEqual([
      'in',
    ]);
    expect(titles(await listUnread({ kind: 'none' }))).toEqual(['loose']);
  });
});

describe('listRead', () => {
  it('lists the most recently read first, whatever the age', async () => {
    await seed('oldest, read last', 1, { readMinute: 30 });
    await seed('newest, read first', 2, { readMinute: 10 });

    expect(titles(await listRead(ALL))).toEqual([
      'oldest, read last',
      'newest, read first',
    ]);
  });

  it('leaves out unread items', async () => {
    await seed('unread', 1);

    expect(await listRead(ALL)).toEqual([]);
  });

  it('filters by topic and by none, and carries the topic name', async () => {
    const dev = await seedTopic('Dev');
    await seed('in', 1, { topicId: dev.id, readMinute: 5 });
    await seed('loose', 2, { readMinute: 6 });

    const inTopic = await listRead({ kind: 'topic', id: dev.id });

    expect(titles(inTopic)).toEqual(['in']);
    expect(inTopic[0].topicName).toBe('Dev');
    expect(titles(await listRead({ kind: 'none' }))).toEqual(['loose']);
  });
});

describe('counts', () => {
  it('counts unread items only', async () => {
    await seed('a', 1);
    await seed('b', 2, { readMinute: 5 });

    expect(await countUnread()).toBe(1);
  });

  it('counts unread items without a topic only', async () => {
    const dev = await seedTopic('Dev');
    await seed('in', 1, { topicId: dev.id });
    await seed('loose', 2);
    await seed('loose read', 3, { readMinute: 5 });

    expect(await unreadWithoutTopic()).toBe(1);
  });
});

describe('listTopics', () => {
  it('lists by name ignoring case, with unread counts only', async () => {
    const beta = await seedTopic('beta');
    await seedTopic('Alpha');
    await seed('unread', 1, { topicId: beta.id });
    await seed('read', 2, { topicId: beta.id, readMinute: 5 });

    expect((await listTopics()).map((t) => [t.name, t.unreadCount])).toEqual([
      ['Alpha', 0],
      ['beta', 1],
    ]);
  });
});

describe('createReadingItem', () => {
  const input = { title: 'A', url: 'https://a.example/' };

  it('creates unread, with null notes and topic by default', async () => {
    expect(await createReadingItem(input)).toMatchObject({
      ...input,
      notes: null,
      topicId: null,
      readAt: null,
    });
  });

  it('rejects a URL that is already unread', async () => {
    await createReadingItem(input);

    await expect(
      createReadingItem({ title: 'B', url: input.url })
    ).rejects.toBeInstanceOf(DuplicateReadingItemError);
  });

  it('rejects a URL that has already been read', async () => {
    await db.insert(readingItems).values({ ...input, readAt: at(1) });

    await expect(
      createReadingItem({ title: 'B', url: input.url })
    ).rejects.toBeInstanceOf(DuplicateReadingItemError);
  });

  it('rejects a topic that does not exist', async () => {
    await expect(
      createReadingItem({ ...input, topicId: UNKNOWN })
    ).rejects.toBeInstanceOf(UnknownTopicError);
  });
});

describe('updateReadingItem / removeReadingItem', () => {
  const input = { title: 'A', url: 'https://a.example/' };

  it('updates only the given fields and clears with null', async () => {
    const row = await createReadingItem({ ...input, notes: 'why' });

    expect(await updateReadingItem(row.id, { title: 'B' })).toMatchObject({
      title: 'B',
      notes: 'why',
    });
    expect(await updateReadingItem(row.id, { notes: null })).toMatchObject({
      title: 'B',
      notes: null,
    });
  });

  it('keeps createdAt, so an edit does not move the item in the queue', async () => {
    const row = await seed('a', 1);

    const updated = await updateReadingItem(row.id, { title: 'renamed' });

    expect(updated?.createdAt).toEqual(at(1));
  });

  it('rejects changing to a URL that is taken', async () => {
    await createReadingItem(input);
    const other = await createReadingItem({
      title: 'B',
      url: 'https://b.example/',
    });

    await expect(
      updateReadingItem(other.id, { url: input.url })
    ).rejects.toBeInstanceOf(DuplicateReadingItemError);
  });

  it('rejects a topic that does not exist', async () => {
    const row = await createReadingItem(input);

    await expect(
      updateReadingItem(row.id, { topicId: UNKNOWN })
    ).rejects.toBeInstanceOf(UnknownTopicError);
  });

  it('returns null or false for an unknown id', async () => {
    expect(await updateReadingItem(UNKNOWN, { title: 'x' })).toBeNull();
    expect(await removeReadingItem(UNKNOWN)).toBe(false);
  });

  it('removes an item', async () => {
    const row = await createReadingItem(input);

    expect(await removeReadingItem(row.id)).toBe(true);
    expect(await db.select().from(readingItems)).toHaveLength(0);
  });
});

describe('resolveTopicFilter', () => {
  it('resolves an unknown topic to all', async () => {
    expect(await resolveTopicFilter({ kind: 'topic', id: UNKNOWN })).toEqual(
      ALL
    );
  });

  it('keeps a topic that exists', async () => {
    const dev = await seedTopic('Dev');
    const filter = { kind: 'topic', id: dev.id } as const;

    expect(await resolveTopicFilter(filter)).toEqual(filter);
  });

  it.each([{ kind: 'all' }, { kind: 'none' }] as const)(
    'passes %j through',
    async (filter) => {
      expect(await resolveTopicFilter(filter)).toEqual(filter);
    }
  );
});
