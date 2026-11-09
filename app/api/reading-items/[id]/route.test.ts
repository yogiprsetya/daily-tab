import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/db';
import { createReadingItem } from '@/features/reading-list/dal';
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
    new Request(`http://localhost/api/reading-items/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    ctx(id)
  );
}
const remove = (id: string) =>
  DELETE(new Request(`http://localhost/api/reading-items/${id}`), ctx(id));
const seed = (url = 'https://a.example/') =>
  createReadingItem({ title: 'A', url });

beforeEach(async () => {
  signOut();
  await db.execute(sql`truncate ${readingItems}, ${readingTopics}`);
});

describe('PATCH /api/reading-items/[id]', () => {
  it('returns 401 without a session', async () => {
    const row = await seed();

    expect((await patch(row.id, { title: 'B' })).status).toBe(401);
  });

  it('updates and clears the note', async () => {
    await signIn();
    const row = await seed();

    const res = await patch(row.id, { notes: 'why' });

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ notes: 'why' });
    expect(await (await patch(row.id, { notes: '' })).json()).toMatchObject({
      notes: null,
    });
  });

  it('marks an item read and unread', async () => {
    await signIn();
    const row = await seed();

    const read = await patch(row.id, { read: true });

    expect(read.status).toBe(200);
    expect((await read.json()).readAt).not.toBeNull();
    expect((await (await patch(row.id, { read: false })).json()).readAt).toBe(
      null
    );
  });

  it('keeps the original readAt when marked read twice', async () => {
    await signIn();
    const row = await seed();

    const first = await (await patch(row.id, { read: true })).json();
    const second = await (await patch(row.id, { read: true })).json();

    expect(second.readAt).toBe(first.readAt);
  });

  it('returns 400 for a read value that is not a boolean', async () => {
    await signIn();
    const row = await seed();

    expect((await patch(row.id, { read: 'yes' })).status).toBe(400);
  });

  it('returns 409 when the URL is taken', async () => {
    await signIn();
    await seed();
    const other = await seed('https://b.example/');

    const res = await patch(other.id, { url: 'a.example' });

    expect(res.status).toBe(409);
    expect((await res.json()).error.message).toBe(
      'This URL is already on your reading list'
    );
  });

  it('allows saving an item with its own URL', async () => {
    await signIn();
    const row = await seed();

    expect((await patch(row.id, { url: 'a.example' })).status).toBe(200);
  });

  it('returns 400 for an empty update and an unknown topic', async () => {
    await signIn();
    const row = await seed();

    expect((await patch(row.id, {})).status).toBe(400);
    expect((await patch(row.id, { topicId: UNKNOWN })).status).toBe(400);
  });

  it.each([UNKNOWN, 'not-a-uuid'])('returns 404 for id %s', async (id) => {
    await signIn();

    expect((await patch(id, { title: 'x' })).status).toBe(404);
  });
});

describe('DELETE /api/reading-items/[id]', () => {
  it('returns 401 without a session', async () => {
    const row = await seed();

    expect((await remove(row.id)).status).toBe(401);
  });

  it('deletes and returns 204', async () => {
    await signIn();
    const row = await seed();

    expect((await remove(row.id)).status).toBe(204);
    expect(await db.select().from(readingItems)).toHaveLength(0);
  });

  it.each([UNKNOWN, 'not-a-uuid'])('returns 404 for id %s', async (id) => {
    await signIn();

    expect((await remove(id)).status).toBe(404);
  });
});
