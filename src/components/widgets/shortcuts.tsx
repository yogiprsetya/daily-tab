import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { ShortcutDialog } from './shortcut-dialog';
import { ShortcutTile, type Shortcut } from './shortcut-tile';
import { loadShortcuts, saveShortcuts } from '~/utils/settings';
import { ScrollArea } from '../ui/scroll-area';

export const ShortcutsWidget = () => {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>(() => loadShortcuts());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Shortcut | null>(null);

  const persist = (next: Shortcut[]) => {
    setShortcuts(next);
    saveShortcuts(next);
  };

  const openEdit = (s: Shortcut) => {
    setEditing(s);
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this shortcut?')) return;
    persist(shortcuts.filter((s) => s.id !== id));
  };

  return (
    <ScrollArea className="h-full flex flex-col bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Shortcuts</h2>
        <div className="flex items-center gap-2">
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Add shortcut"
            onClick={() => setOpen(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>

          <ShortcutDialog
            open={open}
            onOpenChange={(e) => {
              setOpen(e);
              setEditing(null);
            }}
            editing={editing}
            onSave={({ title: t, url: u }) => {
              const trimmedTitle = t.trim();
              const trimmedUrl = u.trim();
              if (!trimmedTitle || !trimmedUrl) return;

              if (editing) {
                const next = shortcuts.map((s) =>
                  s.id === editing.id
                    ? {
                        ...s,
                        title: trimmedTitle,
                        url: trimmedUrl,
                        updatedAt: Date.now(),
                      }
                    : s
                );
                persist(next);
              } else {
                const id = Date.now().toString();
                const item: Shortcut = {
                  id,
                  title: trimmedTitle,
                  url: trimmedUrl,
                  createdAt: Date.now(),
                  updatedAt: Date.now(),
                };
                persist([item, ...shortcuts]);
              }
            }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
          {shortcuts.map((s) => (
            <ShortcutTile
              key={s.id}
              s={s}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>
    </ScrollArea>
  );
};
