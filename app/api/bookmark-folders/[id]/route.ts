import { requireSession } from '@/features/auth/require-session';
import {
  duplicateFolder,
  folderNotFound,
} from '@/features/bookmarks/api-errors';
import {
  DuplicateFolderError,
  removeFolder,
  updateFolder,
} from '@/features/bookmarks/dal';
import { updateFolderBody } from '@/features/bookmarks/validation';
import { isUuid, json, parseBody } from '@/lib/api';

export async function PATCH(
  request: Request,
  ctx: RouteContext<'/api/bookmark-folders/[id]'>
) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  if (!isUuid(id)) return folderNotFound();

  const body = await parseBody(request, updateFolderBody);
  if (!body.ok) return body.response;

  try {
    const row = await updateFolder(id, body.data.name);
    return row ? json(row) : folderNotFound();
  } catch (error) {
    if (error instanceof DuplicateFolderError) return duplicateFolder();
    throw error;
  }
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<'/api/bookmark-folders/[id]'>
) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  if (!isUuid(id) || !(await removeFolder(id))) return folderNotFound();

  return new Response(null, { status: 204 });
}
