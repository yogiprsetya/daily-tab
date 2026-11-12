import { requireSession } from '@/features/auth/require-session';
import { duplicateTopic } from '@/features/reading-list/api-errors';
import {
  DuplicateTopicError,
  countUnread,
  createTopic,
  listTopics,
  unreadWithoutTopic,
} from '@/features/reading-list/dal';
import { createTopicBody } from '@/features/reading-list/validation';
import { json, parseBody } from '@/lib/api';
import { invalidateData } from '@/lib/server-cache';

/** `total` and `withoutTopic` feed the All and No topic filter counts. */
export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const [items, total, withoutTopic] = await Promise.all([
    listTopics(),
    countUnread(),
    unreadWithoutTopic(),
  ]);

  return json({ items, total, withoutTopic });
}

export async function POST(request: Request) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const body = await parseBody(request, createTopicBody);
  if (!body.ok) return body.response;

  try {
    const topic = await createTopic(body.data.name);
    invalidateData('reading-topics', 'reading-items');
    return json(topic, { status: 201 });
  } catch (error) {
    if (error instanceof DuplicateTopicError) return duplicateTopic();
    throw error;
  }
}
