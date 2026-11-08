import { requireSession } from '@/features/auth/require-session';
import { todoNotFound, unknownProject } from '@/features/todos/api-errors';
import {
  UnknownProjectError,
  removeTodo,
  updateTodo,
} from '@/features/todos/dal';
import { updateTodoBody } from '@/features/todos/validation';
import { isUuid, json, parseBody } from '@/lib/api';

export async function PATCH(
  request: Request,
  ctx: RouteContext<'/api/todos/[id]'>
) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  if (!isUuid(id)) return todoNotFound();

  const body = await parseBody(request, updateTodoBody);
  if (!body.ok) return body.response;

  try {
    const row = await updateTodo(id, body.data);
    return row ? json(row) : todoNotFound();
  } catch (error) {
    if (error instanceof UnknownProjectError) return unknownProject();
    throw error;
  }
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<'/api/todos/[id]'>
) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  if (!isUuid(id) || !(await removeTodo(id))) return todoNotFound();

  return new Response(null, { status: 204 });
}
