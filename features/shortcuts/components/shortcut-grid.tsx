'use client';

import { ChevronDown, ChevronUp, Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import { SiteIcon } from '@/components/site-icon';
import { apiRequest } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { useShortcutsInvalidate } from '../hooks';
import { GRID } from './grid-styles';
import { ShortcutDialog } from './shortcut-dialog';
import type { ShortcutItem } from './types';

const TILE =
  'flex min-h-22 min-w-0 flex-col items-center gap-2 rounded-lg p-2 text-xs transition-colors outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring';
const ICON_BUTTON =
  'flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-30 disabled:hover:bg-transparent';
const TEXT_BUTTON =
  'flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring';

type DialogState = { key: string; shortcut: ShortcutItem | null } | null;

function ShortcutTiles({ items }: { items: ShortcutItem[] }) {
  return (
    <ul className={GRID}>
      {items.map((item) => (
        <li key={item.id} className="min-w-0">
          {/* _top: inside the extension's New Tab frame, open the site in the whole tab. */}
          <a href={item.url} target="_top" className={TILE}>
            <SiteIcon title={item.title} url={item.url} />
            <span className="w-full truncate text-center">{item.title}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

function ShortcutRows({
  items,
  moving,
  onMove,
  onEdit,
  onAdd,
}: {
  items: ShortcutItem[];
  moving: boolean;
  onMove: (id: string, direction: 'up' | 'down') => void;
  onEdit: (item: ShortcutItem) => void;
  onAdd: () => void;
}) {
  return (
    <ul className="grid gap-1 lg:grid-cols-2">
      {items.map((item, index) => (
        <li key={item.id} className="flex min-w-0 items-center gap-2">
          <SiteIcon title={item.title} url={item.url} />
          <span className="min-w-0 flex-1 truncate text-sm">{item.title}</span>
          <button
            type="button"
            aria-label={`Move ${item.title} up`}
            disabled={index === 0 || moving}
            onClick={() => onMove(item.id, 'up')}
            className={ICON_BUTTON}
          >
            <ChevronUp aria-hidden className="size-5" />
          </button>
          <button
            type="button"
            aria-label={`Move ${item.title} down`}
            disabled={index === items.length - 1 || moving}
            onClick={() => onMove(item.id, 'down')}
            className={ICON_BUTTON}
          >
            <ChevronDown aria-hidden className="size-5" />
          </button>
          <button
            type="button"
            aria-label={`Edit ${item.title}`}
            onClick={() => onEdit(item)}
            className={ICON_BUTTON}
          >
            <Pencil aria-hidden className="size-4" />
          </button>
        </li>
      ))}
      <li>
        <button
          type="button"
          onClick={onAdd}
          className={cn(TEXT_BUTTON, 'w-full')}
        >
          <Plus aria-hidden className="size-4" />
          Add shortcut
        </button>
      </li>
    </ul>
  );
}

export function ShortcutGrid({ items }: { items: ShortcutItem[] }) {
  const invalidate = useShortcutsInvalidate();
  const [editing, setEditing] = useState(false);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function move(id: string, direction: 'up' | 'down') {
    setMovingId(id);
    setError(null);
    const result = await apiRequest(`/api/shortcuts/${id}/move`, {
      method: 'POST',
      body: { direction },
    });
    setMovingId(null);

    if (result.ok) invalidate();
    else setError(result.message);
  }

  const openAdd = () => setDialog({ key: 'add', shortcut: null });
  const hasItems = items.length > 0;

  return (
    <>
      <div className="flex min-h-11 items-center justify-between gap-2">
        <h2
          id="shortcuts-heading"
          className="text-base font-medium tracking-tight"
        >
          Shortcuts
        </h2>
        {hasItems && (
          <button
            type="button"
            onClick={() => setEditing((value) => !value)}
            className={cn(TEXT_BUTTON, '-mr-3')}
          >
            {editing ? 'Done' : 'Edit'}
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {!hasItems && (
        <div className="flex flex-col items-start gap-2">
          <p className="text-sm text-muted-foreground">No shortcuts yet.</p>
          <button
            type="button"
            onClick={openAdd}
            className={cn(TEXT_BUTTON, '-ml-3')}
          >
            <Plus aria-hidden className="size-4" />
            Add shortcut
          </button>
        </div>
      )}
      {hasItems && !editing && (
        <div className="rounded-xl border border-border bg-card p-2 sm:p-3">
          <ShortcutTiles items={items} />
        </div>
      )}
      {hasItems && editing && (
        <ShortcutRows
          items={items}
          moving={movingId !== null}
          onMove={move}
          onEdit={(item) => setDialog({ key: item.id, shortcut: item })}
          onAdd={openAdd}
        />
      )}

      {dialog && (
        <ShortcutDialog
          key={dialog.key}
          shortcut={dialog.shortcut}
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null);
            invalidate();
          }}
        />
      )}
    </>
  );
}
