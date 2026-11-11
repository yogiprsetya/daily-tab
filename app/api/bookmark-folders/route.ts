import { requireSession } from '@/features/auth/require-session';
import { duplicateFolder } from '@/features/bookmarks/api-errors';
import {
  DuplicateFolderError,
  countBookmarks,
  countWithoutFolder,
  createFolder,
  listFolders,
} from '@/features/bookmarks/dal';
import { createFolderBody } from '@/features/bookmarks/validation';
import { json, parseBody } from '@/lib/api';

/** `total` and `withoutFolder` feed the All and No folder filter counts. */
export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const [items, total, withoutFolder] = await Promise.all([
    listFolders(),
    countBookmarks(),
    countWithoutFolder(),
  ]);

  return json({ items, total, withoutFolder });
}

export async function POST(request: Request) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const body = await parseBody(request, createFolderBody);
  if (!body.ok) return body.response;

  try {
    return json(await createFolder(body.data.name), { status: 201 });
  } catch (error) {
    if (error instanceof DuplicateFolderError) return duplicateFolder();
    throw error;
  }
}
