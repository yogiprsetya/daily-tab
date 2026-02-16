import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { ShortcutDialog } from '../common/shortcut-dialog';
import { ShortcutTile, type Shortcut } from '../common/shortcut-tile';
import { useShortcuts } from '~/state/use-shortcuts';
import { ScrollArea } from '../ui/scroll-area';
import { showConfirm } from '~/components/ui/alert-provider';
import { Separator } from '../ui/separator';

export const ShortcutsWidget = () => {
  const { shortcuts, addShortcut, updateShortcut, deleteShortcut } =
    useShortcuts();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Shortcut | null>(null);

  const openEdit = (s: Shortcut) => {
    setEditing(s);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    const ok = await showConfirm('Delete this shortcut?', 'Delete shortcut');
    if (!ok) return;
    deleteShortcut(id);
  };

  return (
    <ScrollArea className="h-full flex flex-col bg-card p-4">
      <div className="flex items-center justify-between mb-4">
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
            onSave={({ title: t, url: u, group: g }) => {
              const trimmedTitle = t.trim();
              const trimmedUrl = u.trim();
              const trimmedGroup = (g ?? '').trim();
              if (!trimmedTitle || !trimmedUrl) return;
              if (editing) {
                updateShortcut(editing.id, {
                  title: trimmedTitle,
                  url: trimmedUrl,
                  group: trimmedGroup,
                });
              } else {
                addShortcut(trimmedTitle, trimmedUrl, trimmedGroup);
              }
            }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {(() => {
          // Group shortcuts by group label; undefined/empty -> "Ungrouped"
          const groups = new Map<string, Shortcut[]>();
          for (const s of shortcuts) {
            const key = (s.group ?? '').trim() || 'Ungrouped';
            const arr = groups.get(key) ?? [];
            arr.push(s);
            groups.set(key, arr);
          }

          // Sort groups alphabetically but keep 'Ungrouped' last
          const ordered = Array.from(groups.entries()).sort((a, b) => {
            const [ga] = a;
            const [gb] = b;
            if (ga === 'Ungrouped' && gb !== 'Ungrouped') return 1;
            if (gb === 'Ungrouped' && ga !== 'Ungrouped') return -1;
            return ga.localeCompare(gb);
          });

          return (
            <div className="space-y-4">
              {ordered.map(([group, items]) => (
                <div key={group} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      {group}
                    </h3>
                    <Separator className="flex-1" />
                  </div>
                  <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                    {items.map((s) => (
                      <ShortcutTile
                        key={s.id}
                        s={s}
                        onEdit={openEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </ScrollArea>
  );
};
