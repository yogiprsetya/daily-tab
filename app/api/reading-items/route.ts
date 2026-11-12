import { requireSession } from '@/features/auth/require-session';
import {
  duplicateReadingItem,
  unknownTopic,
} from '@/features/reading-list/api-errors';
import {
  DuplicateReadingItemError,
  UnknownTopicError,
  createReadingItem,
  listRead,
  listUnread,
  resolveTopicFilter,
} from '@/features/reading-list/dal';
import {
  createReadingItemBody,
  parseTopicFilter,
} from '@/features/reading-list/validation';
import { json, parseBody } from '@/lib/api';

export async function GET(request: Request) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const filter = await resolveTopicFilter(
    parseTopicFilter(searchParams.get('topic') ?? undefined)
  );
  const [unread, read] = await Promise.all([
    listUnread(filter),
    listRead(filter),
  ]);

  // `filter` is the resolved one, so an unknown topic reads as All.
  return json({ items: [...unread, ...read], filter });
}

export async function POST(request: Request) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const body = await parseBody(request, createReadingItemBody);
  if (!body.ok) return body.response;

  try {
    return json(await createReadingItem(body.data), { status: 201 });
  } catch (error) {
    if (error instanceof DuplicateReadingItemError) {
      return duplicateReadingItem();
    }
    if (error instanceof UnknownTopicError) return unknownTopic();
    throw error;
  }
}
