import { requireSession } from '@/features/auth/require-session';
import {
  duplicateBookmark,
  unknownFolder,
} from '@/features/bookmarks/api-errors';
import {
  DuplicateBookmarkError,
  UnknownFolderError,
  createBookmark,
  listBookmarks,
  resolveFolderFilter,
} from '@/features/bookmarks/dal';
import {
  createBookmarkBody,
  parseFolderFilter,
  parseSearch,
} from '@/features/bookmarks/validation';
import { json, parseBody } from '@/lib/api';

export async function GET(request: Request) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const filter = await resolveFolderFilter(
    parseFolderFilter(searchParams.get('folder') ?? undefined)
  );
  const query = parseSearch(searchParams.get('q') ?? undefined);

  // `filter` is the resolved one, so an unknown folder reads as All.
  return json({ items: await listBookmarks(filter, query), filter });
}

export async function POST(request: Request) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const body = await parseBody(request, createBookmarkBody);
  if (!body.ok) return body.response;

  try {
    return json(await createBookmark(body.data), { status: 201 });
  } catch (error) {
    if (error instanceof DuplicateBookmarkError) return duplicateBookmark();
    if (error instanceof UnknownFolderError) return unknownFolder();
    throw error;
  }
}
