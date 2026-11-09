import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/db';
import { createBookmark, createFolder } from '@/features/bookmarks/dal';
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
    new Request(`http://localhost/api/bookmark-folders/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    ctx(id)
  );
}
const remove = (id: string) =>
  DELETE(new Request(`http://localhost/api/bookmark-folders/${id}`), ctx(id));

beforeEach(async () => {
  signOut();
  await db.execute(sql`truncate ${bookmarks}, ${bookmarkFolders}`);
});

describe('PATCH /api/bookmark-folders/[id]', () => {
  it('returns 401 without a session', async () => {
    const row = await createFolder('Dev');

    expect((await patch(row.id, { name: 'X' })).status).toBe(401);
  });

  it('renames, and returns 409 when the name is taken', async () => {
    await signIn();
    await createFolder('Dev');
    const home = await createFolder('Home');

    expect(
      await (await patch(home.id, { name: 'House' })).json()
    ).toMatchObject({ name: 'House' });
    expect((await patch(home.id, { name: 'dev' })).status).toBe(409);
  });

  it.each([UNKNOWN, 'not-a-uuid'])('returns 404 for id %s', async (id) => {
    await signIn();

    expect((await patch(id, { name: 'x' })).status).toBe(404);
  });
});

describe('DELETE /api/bookmark-folders/[id]', () => {
  it('returns 401 without a session', async () => {
    const row = await createFolder('Dev');

    expect((await remove(row.id)).status).toBe(401);
  });

  it('deletes the folder and keeps its bookmarks', async () => {
    await signIn();
    const dev = await createFolder('Dev');
    await createBookmark({
      title: 'survives',
      url: 'https://a.example/',
      folderId: dev.id,
    });

    expect((await remove(dev.id)).status).toBe(204);
    expect(await db.select().from(bookmarks)).toMatchObject([
      { title: 'survives', folderId: null },
    ]);
  });

  it.each([UNKNOWN, 'not-a-uuid'])('returns 404 for id %s', async (id) => {
    await signIn();

    expect((await remove(id)).status).toBe(404);
  });
});
