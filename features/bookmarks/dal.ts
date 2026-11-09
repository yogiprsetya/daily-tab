import 'server-only';
import {
  and,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  ilike,
  isNull,
  or,
  sql,
} from 'drizzle-orm';
import { db } from '@/db';
import {
  FOREIGN_KEY_VIOLATION,
  UNIQUE_VIOLATION,
  translatePgError,
} from '@/db/pg-errors';
import { bookmarkFolders, bookmarks } from './schema';
import { type FolderFilter, escapeLike } from './validation';

export class DuplicateBookmarkError extends Error {}
export class UnknownFolderError extends Error {}
export class DuplicateFolderError extends Error {}

const BOOKMARK_ERRORS = {
  [UNIQUE_VIOLATION]: DuplicateBookmarkError,
  [FOREIGN_KEY_VIOLATION]: UnknownFolderError,
};
const FOLDER_ERRORS = { [UNIQUE_VIOLATION]: DuplicateFolderError };

type BookmarkFields = {
  title?: string;
  url?: string;
  notes?: string | null;
  folderId?: string | null;
};

function matchesFilter(filter: FolderFilter) {
  if (filter.kind === 'none') return isNull(bookmarks.folderId);
  if (filter.kind === 'folder') return eq(bookmarks.folderId, filter.id);
  return undefined;
}

function matchesSearch(query: string | undefined) {
  if (!query) return undefined;
  const pattern = `%${escapeLike(query)}%`;
  return or(
    ilike(bookmarks.title, pattern),
    ilike(bookmarks.url, pattern),
    ilike(bookmarks.notes, pattern)
  );
}

export function listBookmarks(filter: FolderFilter, query?: string) {
  return db
    .select({
      ...getTableColumns(bookmarks),
      folderName: bookmarkFolders.name,
    })
    .from(bookmarks)
    .leftJoin(bookmarkFolders, eq(bookmarks.folderId, bookmarkFolders.id))
    .where(and(matchesFilter(filter), matchesSearch(query)))
    .orderBy(desc(bookmarks.createdAt), asc(bookmarks.title));
}

export async function countBookmarks(): Promise<number> {
  const [row] = await db.select({ total: count() }).from(bookmarks);
  return row.total;
}

export async function countWithoutFolder(): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(bookmarks)
    .where(isNull(bookmarks.folderId));
  return row.total;
}

/** A filter on a folder that no longer exists behaves as All. */
export async function resolveFolderFilter(
  filter: FolderFilter
): Promise<FolderFilter> {
  if (filter.kind !== 'folder') return filter;
  const [row] = await db
    .select({ id: bookmarkFolders.id })
    .from(bookmarkFolders)
    .where(eq(bookmarkFolders.id, filter.id));
  return row ? filter : { kind: 'all' };
}

export function createBookmark(
  input: BookmarkFields & { title: string; url: string }
) {
  return translatePgError(BOOKMARK_ERRORS, async () => {
    const [row] = await db.insert(bookmarks).values(input).returning();
    return row;
  });
}

export function updateBookmark(id: string, fields: BookmarkFields) {
  return translatePgError(BOOKMARK_ERRORS, async () => {
    const [row] = await db
      .update(bookmarks)
      .set({ ...fields, updatedAt: new Date() })
      .where(eq(bookmarks.id, id))
      .returning();
    return row ?? null;
  });
}

export async function removeBookmark(id: string): Promise<boolean> {
  const rows = await db
    .delete(bookmarks)
    .where(eq(bookmarks.id, id))
    .returning({ id: bookmarks.id });
  return rows.length > 0;
}

export function listFolders() {
  return db
    .select({
      ...getTableColumns(bookmarkFolders),
      bookmarkCount: count(bookmarks.id),
    })
    .from(bookmarkFolders)
    .leftJoin(bookmarks, eq(bookmarks.folderId, bookmarkFolders.id))
    .groupBy(bookmarkFolders.id)
    .orderBy(sql`lower(${bookmarkFolders.name})`);
}

export function createFolder(name: string) {
  return translatePgError(FOLDER_ERRORS, async () => {
    const [row] = await db.insert(bookmarkFolders).values({ name }).returning();
    return row;
  });
}

export function updateFolder(id: string, name: string) {
  return translatePgError(FOLDER_ERRORS, async () => {
    const [row] = await db
      .update(bookmarkFolders)
      .set({ name })
      .where(eq(bookmarkFolders.id, id))
      .returning();
    return row ?? null;
  });
}

/** Its bookmarks stay and fall back to No folder (`ON DELETE SET NULL`). */
export async function removeFolder(id: string): Promise<boolean> {
  const rows = await db
    .delete(bookmarkFolders)
    .where(eq(bookmarkFolders.id, id))
    .returning({ id: bookmarkFolders.id });
  return rows.length > 0;
}
