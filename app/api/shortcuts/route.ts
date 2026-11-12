import { requireSession } from '@/features/auth/require-session';
import { createShortcut, listShortcuts } from '@/features/shortcuts/dal';
import { createShortcutBody } from '@/features/shortcuts/validation';
import { json, parseBody } from '@/lib/api';
import { invalidateData } from '@/lib/server-cache';

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  return json({ items: await listShortcuts() });
}

export async function POST(request: Request) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const body = await parseBody(request, createShortcutBody);
  if (!body.ok) return body.response;

  const shortcut = await createShortcut(body.data);
  invalidateData('shortcuts');
  return json(shortcut, { status: 201 });
}
