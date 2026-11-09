import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/db';
import { createReadingItem, createTopic } from '@/features/reading-list/dal';
import { readingItems, readingTopics } from '@/features/reading-list/schema';
import { signIn, signOut } from '@/tests/session';
import { GET, POST } from './route';

vi.mock('next/headers', async () => ({
  cookies: (await import('@/tests/session')).mockedCookies,
}));

function post(body: unknown) {
  return POST(
    new Request('http://localhost/api/reading-topics', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
  );
}

beforeEach(async () => {
  signOut();
  await db.execute(sql`truncate ${readingItems}, ${readingTopics}`);
});

describe('GET /api/reading-topics', () => {
  it('returns 401 without a session', async () => {
    expect((await GET()).status).toBe(401);
  });

  it('returns topics with unread counts', async () => {
    await signIn();
    const dev = await createTopic('Dev');
    await createReadingItem({
      title: 'A',
      url: 'https://a.example/',
      topicId: dev.id,
    });

    const res = await GET();

    expect(res.status).toBe(200);
    expect((await res.json()).items).toMatchObject([
      { name: 'Dev', unreadCount: 1 },
    ]);
  });
});

describe('POST /api/reading-topics', () => {
  it('returns 401 without a session', async () => {
    expect((await post({ name: 'Dev' })).status).toBe(401);
  });

  it('creates a topic', async () => {
    await signIn();

    const res = await post({ name: ' Dev ' });

    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ name: 'Dev' });
  });

  it('returns 409 for a duplicate and 400 for an empty name', async () => {
    await signIn();
    await createTopic('dev');

    expect((await post({ name: 'Dev' })).status).toBe(409);
    expect((await post({ name: ' ' })).status).toBe(400);
  });
});
