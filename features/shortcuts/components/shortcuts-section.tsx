import { requirePageSession } from '@/features/auth/require-session';
import { listShortcuts } from '../dal';
import { ShortcutGrid } from './shortcut-grid';

/** Reads the session and the database: render inside <Suspense>. */
export async function ShortcutsSection() {
  await requirePageSession();
  const rows = await listShortcuts();

  return (
    <ShortcutGrid
      items={rows.map(({ id, title, url }) => ({ id, title, url }))}
    />
  );
}
