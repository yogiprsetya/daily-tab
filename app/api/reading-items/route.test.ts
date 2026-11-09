import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/db';
import { readingItems, readingTopics } from '@/features/reading-list/schema';
import { signIn, signOut } from '@/tests/session';
import { GET, POST } from './route';

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

function post(body: unknown) {
  return POST(
    new Request('http://localhost/api/reading-items', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
  );
}

describe('POST /api/reading-items', () => {
  const DUPLICATE = 'This URL is already on your reading list';

  it('returns 401 without a session', async () => {
    expect((await post({ title: 'A', url: 'a.example' })).status).toBe(401);
  });

  it('creates an unread item with a normalized URL', async () => {
    await signIn();

    const res = await post({ title: ' A ', url: 'a.example', notes: 'why' });

    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({
      title: 'A',
      url: 'https://a.example/',
      notes: 'why',
      topicId: null,
      readAt: null,
    });
  });

  it('accepts an existing topic', async () => {
    await signIn();
    const dev = await seedTopic('Dev');

    const res = await post({ title: 'A', url: 'a.example', topicId: dev.id });

    expect(res.status).toBe(201);
    expect((await res.json()).topicId).toBe(dev.id);
  });

  it('returns 409 on the url field for a duplicate after normalization', async () => {
    await signIn();
    await post({ title: 'A', url: 'github.com' });

    const res = await post({ title: 'B', url: 'https://github.com/' });

    expect(res.status).toBe(409);
    const { error } = await res.json();
    expect(error.code).toBe('conflict');
    expect(error.message).toBe(DUPLICATE);
    expect(error.issues[0]).toMatchObject({
      path: ['url'],
      message: DUPLICATE,
    });
  });

  it('returns 409 when the existing item has been read', async () => {
    await signIn();
    await seed('done', 1, { readAt: at(5) });

    const res = await post({ title: 'B', url: 'done.example' });

    expect(res.status).toBe(409);
    expect((await res.json()).error.message).toBe(DUPLICATE);
  });

  it('returns 400 for a topic that does not exist', async () => {
    await signIn();

    const res = await post({ title: 'A', url: 'a.example', topicId: UNKNOWN });

    expect(res.status).toBe(400);
    expect((await res.json()).error.issues[0].path).toEqual(['topicId']);
  });

  it.each([
    { title: '', url: 'a.example' },
    { title: 'A', url: 'javascript:alert(1)' },
    { title: 'A', url: 'https://user:pw@a.example' },
  ])('returns 400 for %j', async (body) => {
    await signIn();

    expect((await post(body)).status).toBe(400);
  });
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
