import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/db';
import { createBookmark, createFolder } from '@/features/bookmarks/dal';
import { bookmarkFolders, bookmarks } from '@/features/bookmarks/schema';
import { signIn, signOut } from '@/tests/session';
import { GET, POST } from './route';

vi.mock('next/headers', async () => ({
  cookies: (await import('@/tests/session')).mockedCookies,
}));

function post(body: unknown) {
  return POST(
    new Request('http://localhost/api/bookmark-folders', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
  );
}

beforeEach(async () => {
  signOut();
  await db.execute(sql`truncate ${bookmarks}, ${bookmarkFolders}`);
});

describe('GET /api/bookmark-folders', () => {
  it('returns 401 without a session', async () => {
    expect((await GET()).status).toBe(401);
  });

  it('returns folders with counts', async () => {
    await signIn();
    const dev = await createFolder('Dev');
    await createBookmark({
      title: 'A',
      url: 'https://a.example/',
      folderId: dev.id,
    });

    expect((await (await GET()).json()).items).toMatchObject([
      { name: 'Dev', bookmarkCount: 1 },
    ]);
  });
});

describe('POST /api/bookmark-folders', () => {
  it('returns 401 without a session', async () => {
    expect((await post({ name: 'Dev' })).status).toBe(401);
  });

  it('creates a folder', async () => {
    await signIn();

    const res = await post({ name: ' Dev ' });

    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ name: 'Dev' });
  });

  it('returns 409 for a duplicate and 400 for an empty name', async () => {
    await signIn();
    await createFolder('dev');

    expect((await post({ name: 'Dev' })).status).toBe(409);
    expect((await post({ name: ' ' })).status).toBe(400);
  });
});
