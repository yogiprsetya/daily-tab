import { requireSession } from '@/features/auth/require-session';
import { listShortcuts } from '@/features/shortcuts/dal';
import { json } from '@/lib/api';

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  return json({ items: await listShortcuts() });
}
