import { requireSession } from '@/features/auth/require-session';
import {
  listRead,
  listUnread,
  resolveTopicFilter,
} from '@/features/reading-list/dal';
import { parseTopicFilter } from '@/features/reading-list/validation';
import { json } from '@/lib/api';

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

  return json({ items: [...unread, ...read] });
}
