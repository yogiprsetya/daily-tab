import { requireSession } from '@/features/auth/require-session';
import {
  duplicateTopic,
  topicNotFound,
} from '@/features/reading-list/api-errors';
import {
  DuplicateTopicError,
  removeTopic,
  updateTopic,
} from '@/features/reading-list/dal';
import { updateTopicBody } from '@/features/reading-list/validation';
import { isUuid, json, parseBody } from '@/lib/api';
import { invalidateData } from '@/lib/server-cache';

export async function PATCH(
  request: Request,
  ctx: RouteContext<'/api/reading-topics/[id]'>
) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  if (!isUuid(id)) return topicNotFound();

  const body = await parseBody(request, updateTopicBody);
  if (!body.ok) return body.response;

  try {
    const row = await updateTopic(id, body.data.name);
    if (row) invalidateData('reading-topics', 'reading-items');
    return row ? json(row) : topicNotFound();
  } catch (error) {
    if (error instanceof DuplicateTopicError) return duplicateTopic();
    throw error;
  }
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<'/api/reading-topics/[id]'>
) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  if (!isUuid(id) || !(await removeTopic(id))) return topicNotFound();

  invalidateData('reading-topics', 'reading-items');
  return new Response(null, { status: 204 });
}
