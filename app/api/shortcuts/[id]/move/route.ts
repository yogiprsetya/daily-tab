import { requireSession } from '@/features/auth/require-session';
import { listShortcuts, moveShortcut } from '@/features/shortcuts/dal';
import { moveShortcutBody } from '@/features/shortcuts/validation';
import { apiError, isUuid, json, parseBody } from '@/lib/api';
import { invalidateData } from '@/lib/server-cache';

const notFound = () => apiError('not_found', 'Shortcut not found');

export async function POST(
  request: Request,
  ctx: RouteContext<'/api/shortcuts/[id]/move'>
) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  if (!isUuid(id)) return notFound();

  const body = await parseBody(request, moveShortcutBody);
  if (!body.ok) return body.response;

  if (!(await moveShortcut(id, body.data.direction))) return notFound();

  invalidateData('shortcuts');
  return json({ items: await listShortcuts() });
}
