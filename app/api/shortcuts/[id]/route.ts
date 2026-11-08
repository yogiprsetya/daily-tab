import { requireSession } from '@/features/auth/require-session';
import { removeShortcut, updateShortcut } from '@/features/shortcuts/dal';
import { updateShortcutBody } from '@/features/shortcuts/validation';
import { apiError, isUuid, json, parseBody } from '@/lib/api';

const notFound = () => apiError('not_found', 'Shortcut not found');

export async function PATCH(
  request: Request,
  ctx: RouteContext<'/api/shortcuts/[id]'>
) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  if (!isUuid(id)) return notFound();

  const body = await parseBody(request, updateShortcutBody);
  if (!body.ok) return body.response;

  const row = await updateShortcut(id, body.data);
  return row ? json(row) : notFound();
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<'/api/shortcuts/[id]'>
) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  if (!isUuid(id) || !(await removeShortcut(id))) return notFound();

  return new Response(null, { status: 204 });
}
