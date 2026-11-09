import { requireSession } from '@/features/auth/require-session';
import { duplicateTopic } from '@/features/reading-list/api-errors';
import {
  DuplicateTopicError,
  createTopic,
  listTopics,
} from '@/features/reading-list/dal';
import { createTopicBody } from '@/features/reading-list/validation';
import { json, parseBody } from '@/lib/api';

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  return json({ items: await listTopics() });
}

export async function POST(request: Request) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const body = await parseBody(request, createTopicBody);
  if (!body.ok) return body.response;

  try {
    return json(await createTopic(body.data.name), { status: 201 });
  } catch (error) {
    if (error instanceof DuplicateTopicError) return duplicateTopic();
    throw error;
  }
}
