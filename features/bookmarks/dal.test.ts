import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/db';
import {
  DuplicateBookmarkError,
  DuplicateFolderError,
  UnknownFolderError,
  countBookmarks,
  countWithoutFolder,
  createBookmark,
  createFolder,
  listBookmarks,
  listFolders,
  removeBookmark,
  removeFolder,
  resolveFolderFilter,
  updateBookmark,
  updateFolder,
} from './dal';
import { bookmarkFolders, bookmarks } from './schema';

const UNKNOWN = '6f1d2c3a-9b4e-4f7a-8c21-0d5e6f7a8b9c';
const ALL = { kind: 'all' } as const;
const at = (minute: number) => new Date(Date.UTC(2026, 10, 8, 9, minute));

beforeEach(async () => {
  await db.execute(sql`truncate ${bookmarks}, ${bookmarkFolders}`);
});

function seed(
  title: string,
  minute: number,
  extra: { folderId?: string; notes?: string; url?: string } = {}
) {
  return db
    .insert(bookmarks)
    .values({
      title,
      url: extra.url ?? `https://${title.replace(/\W/g, '')}.example/`,
      notes: extra.notes,
      folderId: extra.folderId,
      createdAt: at(minute),
    })
    .returning()
    .then(([row]) => row);
}

const titles = (rows: { title: string }[]) => rows.map((r) => r.title);

describe('listBookmarks', () => {
  it('lists newest first with the folder name', async () => {
    const dev = await createFolder('Dev');
    await seed('older', 1, { folderId: dev.id });
    await seed('newer', 2);

    const rows = await listBookmarks(ALL);

    expect(titles(rows)).toEqual(['newer', 'older']);
    expect(rows[1].folderName).toBe('Dev');
    expect(rows[0].folderName).toBeNull();
  });

  it('filters by folder and by none', async () => {
    const dev = await createFolder('Dev');
    await seed('in', 1, { folderId: dev.id });
    await seed('loose', 2);

    expect(titles(await listBookmarks({ kind: 'folder', id: dev.id }))).toEqual(
      ['in']
    );
    expect(titles(await listBookmarks({ kind: 'none' }))).toEqual(['loose']);
  });

  it('searches title, URL and note ignoring case', async () => {
    await seed('Next Docs', 1);
    await seed('other', 2, { url: 'https://DRIZZLE.example/' });
    await seed('third', 3, { notes: 'Remember the PIZZA recipe' });

    expect(titles(await listBookmarks(ALL, 'next'))).toEqual(['Next Docs']);
    expect(titles(await listBookmarks(ALL, 'drizzle'))).toEqual(['other']);
    expect(titles(await listBookmarks(ALL, 'pizza'))).toEqual(['third']);
  });

  it('combines search with the folder', async () => {
    const dev = await createFolder('Dev');
    await seed('docs one', 1, { folderId: dev.id });
    await seed('docs two', 2);

    expect(
      titles(await listBookmarks({ kind: 'folder', id: dev.id }, 'docs'))
    ).toEqual(['docs one']);
  });

  it('treats % and _ literally', async () => {
    await seed('100% done', 1, { url: 'https://a.example/' });
    await seed('100 percent', 2, { url: 'https://b.example/' });
    await seed('a_b', 3, { url: 'https://c.example/' });
    await seed('axb', 4, { url: 'https://d.example/' });

    expect(titles(await listBookmarks(ALL, '100%'))).toEqual(['100% done']);
    expect(titles(await listBookmarks(ALL, 'a_b'))).toEqual(['a_b']);
  });
});

describe('counts and folders', () => {
  it('counts bookmarks in total and without a folder', async () => {
    const dev = await createFolder('Dev');
    await seed('a', 1, { folderId: dev.id });
    await seed('b', 2);

    expect(await countBookmarks()).toBe(2);
    expect(await countWithoutFolder()).toBe(1);
  });

  it('lists folders by name ignoring case, with counts', async () => {
    const b = await createFolder('beta');
    await createFolder('Alpha');
    await seed('a', 1, { folderId: b.id });

    expect((await listFolders()).map((f) => [f.name, f.bookmarkCount])).toEqual(
      [
        ['Alpha', 0],
        ['beta', 1],
      ]
    );
  });

  it('resolves an unknown folder to all', async () => {
    expect(await resolveFolderFilter({ kind: 'folder', id: UNKNOWN })).toEqual(
      ALL
    );
  });

  it('keeps a folder that exists', async () => {
    const dev = await createFolder('Dev');
    const filter = { kind: 'folder', id: dev.id } as const;

    expect(await resolveFolderFilter(filter)).toEqual(filter);
  });
});

describe('createBookmark / updateBookmark / removeBookmark', () => {
  const input = { title: 'A', url: 'https://a.example/' };

  it('creates with null notes and folder by default', async () => {
    expect(await createBookmark(input)).toMatchObject({
      ...input,
      notes: null,
      folderId: null,
    });
  });

  it('rejects a duplicate URL', async () => {
    await createBookmark(input);

    await expect(
      createBookmark({ title: 'B', url: input.url })
    ).rejects.toBeInstanceOf(DuplicateBookmarkError);
  });

  it('rejects changing to a URL that is taken', async () => {
    await createBookmark(input);
    const other = await createBookmark({
      title: 'B',
      url: 'https://b.example/',
    });

    await expect(
      updateBookmark(other.id, { url: input.url })
    ).rejects.toBeInstanceOf(DuplicateBookmarkError);
  });

  it('rejects a folder that does not exist', async () => {
    await expect(
      createBookmark({ ...input, folderId: UNKNOWN })
    ).rejects.toBeInstanceOf(UnknownFolderError);
  });

  it('updates only the given fields and clears with null', async () => {
    const row = await createBookmark({ ...input, notes: 'why' });

    expect(await updateBookmark(row.id, { title: 'B' })).toMatchObject({
      title: 'B',
      notes: 'why',
    });
    expect(await updateBookmark(row.id, { notes: null })).toMatchObject({
      title: 'B',
      notes: null,
    });
  });

  it('returns null or false for an unknown id', async () => {
    expect(await updateBookmark(UNKNOWN, { title: 'x' })).toBeNull();
    expect(await removeBookmark(UNKNOWN)).toBe(false);
  });

  it('removes a bookmark', async () => {
    const row = await createBookmark(input);

    expect(await removeBookmark(row.id)).toBe(true);
    expect(await db.select().from(bookmarks)).toHaveLength(0);
  });
});

describe('folder writes', () => {
  it('rejects a duplicate name in any case', async () => {
    await createFolder('dev');

    await expect(createFolder('Dev')).rejects.toBeInstanceOf(
      DuplicateFolderError
    );
  });

  it('rejects renaming onto another folder', async () => {
    await createFolder('dev');
    const home = await createFolder('home');

    await expect(updateFolder(home.id, 'DEV')).rejects.toBeInstanceOf(
      DuplicateFolderError
    );
  });

  it('returns null or false for an unknown id', async () => {
    expect(await updateFolder(UNKNOWN, 'x')).toBeNull();
    expect(await removeFolder(UNKNOWN)).toBe(false);
  });

  it('keeps bookmarks when their folder is deleted', async () => {
    const dev = await createFolder('Dev');
    const row = await seed('survives', 1, { folderId: dev.id });

    expect(await removeFolder(dev.id)).toBe(true);

    expect(await db.select().from(bookmarks)).toMatchObject([
      { id: row.id, folderId: null },
    ]);
  });
});
