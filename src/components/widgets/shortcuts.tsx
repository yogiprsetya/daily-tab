import { Plus, Edit3, Trash2 } from 'lucide-react';
import { type SyntheticEvent, useState } from 'react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '~/components/ui/dialog';
import { loadShortcuts, saveShortcuts } from '~/utils/settings';

type Shortcut = {
  id: string;
  title: string;
  url: string;
  createdAt?: number;
  updatedAt?: number;
};

const InlineFallbackSvg = (size = 64) => {
  const svg = `<?xml version='1.0' encoding='UTF-8'?><svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'><rect width='100%' height='100%' fill='%23e5e7eb'/><text x='50%' y='55%' font-size='28' text-anchor='middle' fill='%236b7280' font-family='Arial'>🌐</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const getDomain = (url: string) => {
  try {
    const u = new URL(url);
    return u.hostname;
  } catch {
    try {
      const u = new URL('https://' + url);
      return u.hostname;
    } catch {
      return '';
    }
  }
};

const ShortcutTile: React.FC<{
  s: Shortcut;
  onEdit: (s: Shortcut) => void;
  onDelete: (id: string) => void;
}> = ({ s, onEdit, onDelete }) => {
  const { title, url, id } = s;
  const domain = getDomain(url) || url;
  const primary = domain
    ? `https://www.google.com/s2/favicons?sz=64&domain=${domain}`
    : '';
  const secondary = domain ? `https://${domain}/favicon.ico` : '';
  const fallback = InlineFallbackSvg(64);

  const handleError = (e: SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;

    if (img.dataset.attempt === 'primary' && secondary) {
      img.dataset.attempt = 'secondary';
      img.src = secondary;
      return;
    }

    img.onerror = null;
    img.src = fallback;
  };

  return (
    <div className="relative">
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="aspect-square bg-muted rounded-lg border border-border flex flex-col items-center justify-center gap-2 p-3 hover:shadow-sm"
      >
        <img
          src={primary || fallback}
          data-attempt="primary"
          onError={handleError}
          alt={`${title} favicon`}
          className="h-10 w-10 rounded-md object-contain"
        />
        <span className="text-xs text-muted-foreground truncate text-center">
          {title}
        </span>
      </a>

      <div className="absolute top-2 right-2 flex gap-1 opacity-0 hover:opacity-100 group">
        <Button
          size="icon-xs"
          variant="ghost"
          aria-label="Edit shortcut"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit(s);
          }}
        >
          <Edit3 className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon-xs"
          variant="ghost"
          aria-label="Delete shortcut"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(id);
          }}
        >
          <Trash2 className="h-3.5 w-3.5 text-red-500" />
        </Button>
      </div>
    </div>
  );
};

export const ShortcutsWidget = () => {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>(() => loadShortcuts());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Shortcut | null>(null);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');

  const persist = (next: Shortcut[]) => {
    setShortcuts(next);
    saveShortcuts(next);
  };

  const openEdit = (s: Shortcut) => {
    setEditing(s);
    setTitle(s.title);
    setUrl(s.url);
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this shortcut?')) return;
    persist(shortcuts.filter((s) => s.id !== id));
  };

  const handleSave = () => {
    const trimmedTitle = title.trim();
    const trimmedUrl = url.trim();
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

    setOpen(false);
  };

  return (
    <div className="h-full flex flex-col bg-card rounded-lg border p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Shortcuts</h2>
        <div className="flex items-center gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="icon-sm" variant="ghost" aria-label="Add shortcut">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editing ? 'Edit Shortcut' : 'Add Shortcut'}
                </DialogTitle>
                <DialogDescription>
                  Add a title and URL for your shortcut. URLs can be full
                  (https://) or domain names.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-2">
                <label className="text-sm text-muted-foreground">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. GitHub"
                />

                <label className="text-sm text-muted-foreground">URL</label>
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://github.com"
                />
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleSave}>{editing ? 'Save' : 'Add'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
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
    </div>
  );
};
