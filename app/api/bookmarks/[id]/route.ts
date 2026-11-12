import { requireSession } from '@/features/auth/require-session';
import {
  bookmarkNotFound,
  duplicateBookmark,
  unknownFolder,
} from '@/features/bookmarks/api-errors';
import {
  DuplicateBookmarkError,
  UnknownFolderError,
  removeBookmark,
  updateBookmark,
} from '@/features/bookmarks/dal';
import { updateBookmarkBody } from '@/features/bookmarks/validation';
import { isUuid, json, parseBody } from '@/lib/api';
import { invalidateData } from '@/lib/server-cache';

export async function PATCH(
  request: Request,
  ctx: RouteContext<'/api/bookmarks/[id]'>
) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  if (!isUuid(id)) return bookmarkNotFound();

  const body = await parseBody(request, updateBookmarkBody);
  if (!body.ok) return body.response;

  try {
    const row = await updateBookmark(id, body.data);
    if (row) invalidateData('bookmarks', 'bookmark-folders');
    return row ? json(row) : bookmarkNotFound();
  } catch (error) {
    if (error instanceof DuplicateBookmarkError) return duplicateBookmark();
    if (error instanceof UnknownFolderError) return unknownFolder();
    throw error;
  }
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<'/api/bookmarks/[id]'>
) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  if (!isUuid(id) || !(await removeBookmark(id))) return bookmarkNotFound();

  invalidateData('bookmarks', 'bookmark-folders');
  return new Response(null, { status: 204 });
}
