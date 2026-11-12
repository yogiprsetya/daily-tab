import { requireSession } from '@/features/auth/require-session';
import { unknownProject } from '@/features/todos/api-errors';
import {
  UnknownProjectError,
  createTodo,
  listTodos,
  resolveFilter,
} from '@/features/todos/dal';
import {
  createTodoBody,
  parseProjectFilter,
} from '@/features/todos/validation';
import { json, parseBody } from '@/lib/api';
import { invalidateData } from '@/lib/server-cache';

export async function GET(request: Request) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const value = new URL(request.url).searchParams.get('project') ?? undefined;
  const filter = await resolveFilter(parseProjectFilter(value));

  // `filter` is the resolved one, so an unknown project reads as All.
  return json({ items: await listTodos(filter), filter });
}

export async function POST(request: Request) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const body = await parseBody(request, createTodoBody);
  if (!body.ok) return body.response;

  try {
    const todo = await createTodo(body.data);
    invalidateData('todos', 'projects');
    return json(todo, { status: 201 });
  } catch (error) {
    if (error instanceof UnknownProjectError) return unknownProject();
    throw error;
  }
}
