'use client';

import { ShortcutIcon } from './shortcut-icon';
import type { ShortcutItem } from './types';

export const GRID = 'grid grid-cols-4 gap-1 sm:grid-cols-6 lg:grid-cols-8';
export const TILE =
  'flex min-h-22 min-w-0 flex-col items-center gap-2 rounded-lg p-2 text-xs transition-colors outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring';

export function ShortcutGrid({ items }: { items: ShortcutItem[] }) {
  return (
    <>
      <h2
        id="shortcuts-heading"
        className="text-sm font-medium text-muted-foreground"
      >
        Shortcuts
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No shortcuts yet.</p>
      ) : (
        <ul className={GRID}>
          {items.map((item) => (
            <li key={item.id} className="min-w-0">
              <a href={item.url} className={TILE}>
                <ShortcutIcon title={item.title} url={item.url} />
                <span className="w-full truncate text-center">
                  {item.title}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
