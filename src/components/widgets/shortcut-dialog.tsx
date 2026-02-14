import { useState } from 'react';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '~/components/ui/dialog';
import { Input } from '~/components/ui/input';
import type { Shortcut } from './shortcut-tile';
import { Label } from '../ui/label';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Shortcut | null;
  onSave: (data: { title: string; url: string }) => void;
};

export const ShortcutDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  editing,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');

  // Use editing values if available, otherwise use local state
  const displayTitle = editing ? editing.title : title;
  const displayUrl = editing ? editing.url : url;

  const handleSave = () => {
    const t = (editing ? displayTitle : title).trim();
    const u = (editing ? displayUrl : url).trim();
    if (!t || !u) return;
    onSave({ title: t, url: u });
    onOpenChange(false);
    setTitle('');
    setUrl('');
  };

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);

    if (!open) {
      setTitle('');
      setUrl('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing ? 'Edit Shortcut' : 'Add Shortcut'}
          </DialogTitle>

          <DialogDescription>
            Add a title and URL for your shortcut. URLs can be full (https://)
            or domain names.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          <Label className="text-sm text-muted-foreground">Title</Label>

          <Input
            value={displayTitle}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. GitHub"
          />

          <Label className="text-sm text-muted-foreground">URL</Label>

          <Input
            value={displayUrl}
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
  );
};
