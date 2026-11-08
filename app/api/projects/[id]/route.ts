import { requireSession } from '@/features/auth/require-session';
import { duplicateProject, projectNotFound } from '@/features/todos/api-errors';
import {
  DuplicateProjectError,
  removeProject,
  updateProject,
} from '@/features/todos/dal';
import { updateProjectBody } from '@/features/todos/validation';
import { isUuid, json, parseBody } from '@/lib/api';

export async function PATCH(
  request: Request,
  ctx: RouteContext<'/api/projects/[id]'>
) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  if (!isUuid(id)) return projectNotFound();

  const body = await parseBody(request, updateProjectBody);
  if (!body.ok) return body.response;

  try {
    const row = await updateProject(id, body.data.name);
    return row ? json(row) : projectNotFound();
  } catch (error) {
    if (error instanceof DuplicateProjectError) return duplicateProject();
    throw error;
  }
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<'/api/projects/[id]'>
) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  if (!isUuid(id) || !(await removeProject(id))) return projectNotFound();

  return new Response(null, { status: 204 });
}
