import { requireSession } from '@/features/auth/require-session';
import { duplicateFolder } from '@/features/bookmarks/api-errors';
import {
  DuplicateFolderError,
  createFolder,
  listFolders,
} from '@/features/bookmarks/dal';
import { createFolderBody } from '@/features/bookmarks/validation';
import { json, parseBody } from '@/lib/api';

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  return json({ items: await listFolders() });
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
