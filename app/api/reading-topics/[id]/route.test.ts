import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/db';
import { createReadingItem, createTopic } from '@/features/reading-list/dal';
import { readingItems, readingTopics } from '@/features/reading-list/schema';
import { signIn, signOut } from '@/tests/session';
import { DELETE, PATCH } from './route';

vi.mock('next/headers', async () => ({
  cookies: (await import('@/tests/session')).mockedCookies,
}));

const UNKNOWN = '6f1d2c3a-9b4e-4f7a-8c21-0d5e6f7a8b9c';
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
function patch(id: string, body: unknown) {
  return PATCH(
    new Request(`http://localhost/api/reading-topics/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    ctx(id)
  );
}
const remove = (id: string) =>
  DELETE(new Request(`http://localhost/api/reading-topics/${id}`), ctx(id));

beforeEach(async () => {
  signOut();
  await db.execute(sql`truncate ${readingItems}, ${readingTopics}`);
});

describe('PATCH /api/reading-topics/[id]', () => {
  it('returns 401 without a session', async () => {
    const row = await createTopic('Dev');

    expect((await patch(row.id, { name: 'X' })).status).toBe(401);
  });

  it('renames, and returns 409 when the name is taken', async () => {
    await signIn();
    await createTopic('Dev');
    const home = await createTopic('Home');

    const res = await patch(home.id, { name: 'House' });

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ name: 'House' });
    expect((await patch(home.id, { name: 'dev' })).status).toBe(409);
  });

  it('returns 400 for an empty name', async () => {
    await signIn();
    const row = await createTopic('Dev');

    expect((await patch(row.id, { name: ' ' })).status).toBe(400);
  });

  it.each([UNKNOWN, 'not-a-uuid'])('returns 404 for id %s', async (id) => {
    await signIn();

    expect((await patch(id, { name: 'x' })).status).toBe(404);
  });
});

describe('DELETE /api/reading-topics/[id]', () => {
  it('returns 401 without a session', async () => {
    const row = await createTopic('Dev');

    expect((await remove(row.id)).status).toBe(401);
  });

  it('deletes the topic and keeps its items', async () => {
    await signIn();
    const dev = await createTopic('Dev');
    await createReadingItem({
      title: 'survives',
      url: 'https://a.example/',
      topicId: dev.id,
    });

    expect((await remove(dev.id)).status).toBe(204);
    expect(await db.select().from(readingItems)).toMatchObject([
      { title: 'survives', topicId: null },
    ]);
  });

  it.each([UNKNOWN, 'not-a-uuid'])('returns 404 for id %s', async (id) => {
    await signIn();

    expect((await remove(id)).status).toBe(404);
  });
});
