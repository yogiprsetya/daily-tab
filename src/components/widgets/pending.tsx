import { Plus, Bookmark, Pencil, Trash2, Link as LinkIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { PendingDialog } from '~/components/common/pending-dialog';
import { usePending } from '~/state/use-pending';
import type { PendingItem, PendingType } from '~/types/pending';
import { showConfirm } from '~/components/ui/alert-provider';

export const PendingWidget = () => {
  const { items, addItem, updateItem, deleteItem } = usePending();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PendingItem | null>(null);

  const handleCreateClick = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const handleSave = (data: {
    title: string;
    type: PendingType;
    url?: string;
  }) => {
    if (editing) {
      updateItem(editing.id, data);
    } else {
      addItem(data);
    }
  };

  const handleEdit = (item: PendingItem) => {
    setEditing(item);
    setDialogOpen(true);
  };

  const handleDelete = async (item: PendingItem) => {
    const ok = await showConfirm('Delete this item?');
    if (ok) deleteItem(item.id);
  };

  const formatType = (t: PendingType) => {
    switch (t) {
      case 'blog':
        return 'Blog';
      case 'video':
        return 'Video';
      case 'pdf':
        return 'PDF';
      case 'article':
        return 'Article';
      default:
        return 'Other';
    }
  };

  return (
    <ScrollArea className="h-full flex flex-col bg-card p-4">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Pending</h2>

          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Add pending item"
            onClick={handleCreateClick}
          >
            <Plus className="size-4" />
          </Button>
        </div>

        <p className="text-xs font-medium text-muted-foreground">
          Need attention but later
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <ul className="space-y-2">
          {items.length === 0 ? (
            <li className="text-sm text-muted-foreground">No pending items</li>
          ) : (
            items.map((item) => (
              <li
                key={item.id}
                className="flex items-start gap-2 p-2 rounded-md hover:bg-muted group border border-border/50"
              >
                <Bookmark className="size-4 shrink-0 mt-0.5 text-muted-foreground" />

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">
                    {item.title}
                  </p>

                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    {formatType(item.type)} •{' '}
                    {new Date(item.updatedAt).toLocaleDateString()}
                    {item.url && (
                      <Button asChild variant="link" size="xs">
                        <a href={item.url} target="_blank" rel="noreferrer">
                          <LinkIcon /> Link
                        </a>
                      </Button>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    aria-label="Edit"
                    onClick={() => handleEdit(item)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>

                  <Button
                    size="icon-xs"
                    variant="ghost"
                    aria-label="Delete"
                    onClick={() => handleDelete(item)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      <PendingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSave={handleSave}
        onDelete={(id) => deleteItem(id)}
      />
    </ScrollArea>
  );
};
