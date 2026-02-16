import { useMemo, useState } from 'react';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '~/components/ui/dialog';
import { useNavbarLinks } from '~/state/use-navbar-links';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ArrowDown, ArrowUp, Pencil, Save, Trash2, X } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const NavbarLinkDialog = ({ open, onOpenChange }: Props) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingUrl, setEditingUrl] = useState('');

  const { links, addLink, removeLink, updateLink, moveLink, maxReached } =
    useNavbarLinks();

  const isEditing = useMemo(() => Boolean(editingId), [editingId]);

  const handleAdd = () => {
    const ok = addLink(title, url);
    if (ok) {
      setTitle('');
      setUrl('');
    }
  };

  const startEdit = (id: string) => {
    const item = links.find((l) => l.id === id);
    if (!item) return;
    setEditingId(id);
    setEditingTitle(item.title);
    setEditingUrl(item.url);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingTitle('');
    setEditingUrl('');
  };

  const handleUpdate = () => {
    if (!editingId) return;
    const ok = updateLink(editingId, editingTitle, editingUrl);
    if (ok) {
      cancelEdit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Navbar</DialogTitle>
          <DialogDescription>Manage your navbar links.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-1">
            <Label htmlFor="title">Title</Label>

            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. GitHub"
            />
          </div>

          <div className="grid gap-1">
            <Label htmlFor="url">URL</Label>

            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            {maxReached && (
              <span className="text-xs text-muted-foreground">
                Maximum 5 links
              </span>
            )}

            <DialogClose asChild>
              <Button
                onClick={handleAdd}
                disabled={maxReached}
                variant="outline"
              >
                Add
              </Button>
            </DialogClose>
          </div>

          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <Label>Existing links</Label>

              {isEditing && (
                <div className="flex items-center gap-2">
                  <Button size="xs" variant="secondary" onClick={handleUpdate}>
                    Save
                  </Button>

                  <Button size="xs" variant="ghost" onClick={cancelEdit}>
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            <ScrollArea className="max-h-32">
              <div className="grid gap-2 mr-2">
                {links.length === 0 && (
                  <span className="text-sm text-muted-foreground">
                    No links yet.
                  </span>
                )}

                {links.map((l, idx) => (
                  <div key={l.id} className="flex items-center gap-2">
                    {editingId === l.id ? (
                      <>
                        <Input
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          placeholder="Title"
                        />

                        <Input
                          value={editingUrl}
                          onChange={(e) => setEditingUrl(e.target.value)}
                          placeholder="https://example.com"
                        />
                      </>
                    ) : (
                      <>
                        <span className="text-sm font-medium">{l.title}</span>
                        <span className="text-xs text-muted-foreground truncate">
                          {l.url}
                        </span>
                      </>
                    )}
                    <div className="ml-auto flex items-center gap-2">
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        disabled={idx === 0}
                        onClick={() => moveLink(l.id, 'up')}
                        title="Move up"
                        aria-label="Move up"
                      >
                        <ArrowUp />
                      </Button>

                      <Button
                        size="icon-xs"
                        variant="ghost"
                        disabled={idx === links.length - 1}
                        onClick={() => moveLink(l.id, 'down')}
                        title="Move down"
                        aria-label="Move down"
                      >
                        <ArrowDown />
                      </Button>

                      {editingId === l.id ? (
                        <>
                          <Button
                            size="icon-xs"
                            variant="secondary"
                            onClick={handleUpdate}
                          >
                            <Save />
                          </Button>

                          <Button
                            size="icon-xs"
                            variant="ghost"
                            onClick={cancelEdit}
                          >
                            <X />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="icon-xs"
                            variant="ghost"
                            onClick={() => startEdit(l.id)}
                          >
                            <Pencil />
                          </Button>

                          <Button
                            size="icon-xs"
                            variant="destructive"
                            onClick={() => removeLink(l.id)}
                          >
                            <Trash2 />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
