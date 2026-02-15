import { useState } from 'react';
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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const ShortcutsDialog = ({ open, onOpenChange }: Props) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');

  const { addLink, maxReached } = useNavbarLinks();

  const handleAdd = () => {
    const ok = addLink(title, url);
    if (ok) {
      setTitle('');
      setUrl('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Shortcuts</DialogTitle>

          <DialogDescription>Manage your navbar links.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
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
        </div>

        <DialogClose asChild>
          <Button onClick={handleAdd} disabled={maxReached} variant="outline">
            Add
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};
