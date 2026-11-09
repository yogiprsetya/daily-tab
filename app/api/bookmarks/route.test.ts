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

const UNKNOWN = '6f1d2c3a-9b4e-4f7a-8c21-0d5e6f7a8b9c';
const get = (query = '') =>
  GET(new Request(`http://localhost/api/bookmarks${query}`));
function post(body: unknown) {
  return POST(
    new Request('http://localhost/api/bookmarks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
  );
}
const titlesOf = async (res: Response) =>
  (await res.json()).items.map((b: { title: string }) => b.title);

beforeEach(async () => {
  signOut();
  await db.execute(sql`truncate ${bookmarks}, ${bookmarkFolders}`);
});

describe('GET /api/bookmarks', () => {
  it('returns 401 without a session', async () => {
    expect((await get()).status).toBe(401);
  });

  it('applies the folder and the search', async () => {
    await signIn();
    const dev = await createFolder('Dev');
    await createBookmark({
      title: 'docs',
      url: 'https://a.example/',
      folderId: dev.id,
    });
    await createBookmark({ title: 'other', url: 'https://b.example/' });

    expect(await titlesOf(await get(`?folder=${dev.id}`))).toEqual(['docs']);
    expect(await titlesOf(await get('?folder=none'))).toEqual(['other']);
    expect(await titlesOf(await get('?q=doc'))).toEqual(['docs']);
  });

  it.each(['?folder=garbage', `?folder=${UNKNOWN}`])(
    'treats %s as all',
    async (query) => {
      await signIn();
      await createBookmark({ title: 'a', url: 'https://a.example/' });

      expect(await titlesOf(await get(query))).toEqual(['a']);
    }
  );
});

describe('POST /api/bookmarks', () => {
  it('returns 401 without a session', async () => {
    expect((await post({ title: 'A', url: 'a.example' })).status).toBe(401);
  });

  it('creates with a normalized URL', async () => {
    await signIn();

    const res = await post({ title: ' A ', url: 'a.example' });

    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({
      title: 'A',
      url: 'https://a.example/',
    });
  });

  it('returns 409 on the url field for a duplicate after normalization', async () => {
    await signIn();
    await post({ title: 'A', url: 'github.com' });

    const res = await post({ title: 'B', url: 'https://github.com/' });

    expect(res.status).toBe(409);
    const { error } = await res.json();
    expect(error.code).toBe('conflict');
    expect(error.issues[0]).toMatchObject({
      path: ['url'],
      message: 'This URL is already bookmarked',
    });
  });

  it('returns 400 for a folder that does not exist', async () => {
    await signIn();

    const res = await post({ title: 'A', url: 'a.example', folderId: UNKNOWN });

    expect(res.status).toBe(400);
    expect((await res.json()).error.issues[0].path).toEqual(['folderId']);
  });

  it('returns 400 for a javascript: URL', async () => {
    await signIn();

    expect(
      (await post({ title: 'A', url: 'javascript:alert(1)' })).status
    ).toBe(400);
  });
});
