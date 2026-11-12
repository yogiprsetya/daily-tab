'use client';

import { LoadError } from '@/components/load-error';
import { useShortcuts } from '../hooks';
import { ShortcutGrid } from './shortcut-grid';
import { ShortcutsSkeleton } from './shortcuts-skeleton';

/** A client section: the page frame stays static while SWR loads the tiles. */
export function ShortcutsSection() {
  const { data, error } = useShortcuts();

  if (error) return <LoadError message={error.message} />;
  if (!data) return <ShortcutsSkeleton />;

  return (
    <ShortcutGrid
      items={data.items.map(({ id, title, url }) => ({ id, title, url }))}
    />
  );
}
