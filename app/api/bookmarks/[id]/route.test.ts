import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/db';
import { createBookmark } from '@/features/bookmarks/dal';
import { bookmarkFolders, bookmarks } from '@/features/bookmarks/schema';
import { signIn, signOut } from '@/tests/session';
import { DELETE, PATCH } from './route';

vi.mock('next/headers', async () => ({
  cookies: (await import('@/tests/session')).mockedCookies,
}));

const UNKNOWN = '6f1d2c3a-9b4e-4f7a-8c21-0d5e6f7a8b9c';
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
function patch(id: string, body: unknown) {
  return PATCH(
    new Request(`http://localhost/api/bookmarks/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    ctx(id)
  );
}
const remove = (id: string) =>
  DELETE(new Request(`http://localhost/api/bookmarks/${id}`), ctx(id));
const seed = (url = 'https://a.example/') =>
  createBookmark({ title: 'A', url });

beforeEach(async () => {
  signOut();
  await db.execute(sql`truncate ${bookmarks}, ${bookmarkFolders}`);
});

describe('PATCH /api/bookmarks/[id]', () => {
  it('returns 401 without a session', async () => {
    const row = await seed();

    expect((await patch(row.id, { title: 'B' })).status).toBe(401);
  });

  it('updates and clears the note', async () => {
    await signIn();
    const row = await seed();

    expect(await (await patch(row.id, { notes: 'why' })).json()).toMatchObject({
      notes: 'why',
    });
    expect(await (await patch(row.id, { notes: '' })).json()).toMatchObject({
      notes: null,
    });
  });

  it('returns 409 when the URL is taken', async () => {
    await signIn();
    await seed();
    const other = await seed('https://b.example/');

    expect((await patch(other.id, { url: 'a.example' })).status).toBe(409);
  });

  it('returns 400 for an empty update and an unknown folder', async () => {
    await signIn();
    const row = await seed();

    expect((await patch(row.id, {})).status).toBe(400);
    expect((await patch(row.id, { folderId: UNKNOWN })).status).toBe(400);
  });

  it.each([UNKNOWN, 'not-a-uuid'])('returns 404 for id %s', async (id) => {
    await signIn();

    expect((await patch(id, { title: 'x' })).status).toBe(404);
  });
});

describe('DELETE /api/bookmarks/[id]', () => {
  it('returns 401 without a session', async () => {
    const row = await seed();

    expect((await remove(row.id)).status).toBe(401);
  });

  it('deletes and returns 204', async () => {
    await signIn();
    const row = await seed();

    expect((await remove(row.id)).status).toBe(204);
    expect(await db.select().from(bookmarks)).toHaveLength(0);
  });

  it.each([UNKNOWN, 'not-a-uuid'])('returns 404 for id %s', async (id) => {
    await signIn();

    expect((await remove(id)).status).toBe(404);
  });
});
