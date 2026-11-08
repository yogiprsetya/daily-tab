import { requireSession } from '@/features/auth/require-session';
import { createShortcut, listShortcuts } from '@/features/shortcuts/dal';
import { createShortcutBody } from '@/features/shortcuts/validation';
import { json, parseBody } from '@/lib/api';

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

  return json(await createShortcut(body.data), { status: 201 });
}
