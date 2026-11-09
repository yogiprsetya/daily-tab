import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/db';
import { readingItems, readingTopics } from '@/features/reading-list/schema';
import { signIn, signOut } from '@/tests/session';
import { GET } from './route';

vi.mock('next/headers', async () => ({
  cookies: (await import('@/tests/session')).mockedCookies,
}));

const UNKNOWN = '6f1d2c3a-9b4e-4f7a-8c21-0d5e6f7a8b9c';
const at = (minute: number) => new Date(Date.UTC(2026, 10, 9, 9, minute));
const get = (query = '') =>
  GET(new Request(`http://localhost/api/reading-items${query}`));
const titlesOf = async (res: Response) =>
  (await res.json()).items.map((i: { title: string }) => i.title);

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
  extra: { topicId?: string; readAt?: Date } = {}
) {
  return db
    .insert(readingItems)
    .values({
      title,
      url: `https://${title}.example/`,
      createdAt: at(minute),
      ...extra,
    })
    .returning()
    .then(([row]) => row);
}

beforeEach(async () => {
  signOut();
  await db.execute(sql`truncate ${readingItems}, ${readingTopics}`);
});

describe('GET /api/reading-items', () => {
  it('returns 401 without a session', async () => {
    expect((await get()).status).toBe(401);
  });

  it('returns unread oldest first, then read most recently read first', async () => {
    await signIn();
    await seed('readFirst', 1, { readAt: at(10) });
    await seed('readLast', 2, { readAt: at(20) });
    await seed('unreadNew', 4);
    await seed('unreadOld', 3);

    const res = await get();

    expect(res.status).toBe(200);
    expect(await titlesOf(res)).toEqual([
      'unreadOld',
      'unreadNew',
      'readLast',
      'readFirst',
    ]);
  });

  it('applies the topic to unread and read items', async () => {
    await signIn();
    const dev = await seedTopic('Dev');
    await seed('in', 1, { topicId: dev.id });
    await seed('inRead', 2, { topicId: dev.id, readAt: at(10) });
    await seed('loose', 3);

    expect(await titlesOf(await get(`?topic=${dev.id}`))).toEqual([
      'in',
      'inRead',
    ]);
    expect(await titlesOf(await get('?topic=none'))).toEqual(['loose']);
  });

  it.each(['?topic=garbage', `?topic=${UNKNOWN}`])(
    'treats %s as all',
    async (query) => {
      await signIn();
      await seed('a', 1);

      expect(await titlesOf(await get(query))).toEqual(['a']);
    }
  );
});
