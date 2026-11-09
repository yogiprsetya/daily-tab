import { requireSession } from '@/features/auth/require-session';
import {
  duplicateReadingItem,
  readingItemNotFound,
  unknownTopic,
} from '@/features/reading-list/api-errors';
import {
  DuplicateReadingItemError,
  UnknownTopicError,
  removeReadingItem,
  updateReadingItem,
} from '@/features/reading-list/dal';
import { updateReadingItemBody } from '@/features/reading-list/validation';
import { isUuid, json, parseBody } from '@/lib/api';

export async function PATCH(
  request: Request,
  ctx: RouteContext<'/api/reading-items/[id]'>
) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  if (!isUuid(id)) return readingItemNotFound();

  const body = await parseBody(request, updateReadingItemBody);
  if (!body.ok) return body.response;

  try {
    const row = await updateReadingItem(id, body.data);
    return row ? json(row) : readingItemNotFound();
  } catch (error) {
    if (error instanceof DuplicateReadingItemError) {
      return duplicateReadingItem();
    }
    if (error instanceof UnknownTopicError) return unknownTopic();
    throw error;
  }
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<'/api/reading-items/[id]'>
) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  if (!isUuid(id) || !(await removeReadingItem(id))) {
    return readingItemNotFound();
  }

  return new Response(null, { status: 204 });
}
