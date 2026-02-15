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
import { useDialogState } from '~/hooks/use-dialog-state';

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
  const { resetState, updateState, getDisplayValue } = useDialogState(editing);

  const handleSave = () => {
    const t = getDisplayValue('title', '').trim();
    const u = getDisplayValue('url', '').trim();
    if (!t || !u) return;
    onSave({ title: t, url: u });
    onOpenChange(false);
    resetState();
  };

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) resetState();
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
          <div className="grid gap-1">
            <Label htmlFor="title">Title</Label>

            <Input
              id="title"
              value={getDisplayValue('title', '')}
              onChange={(e) => updateState('title', e.target.value)}
              placeholder="e.g. GitHub"
            />
          </div>

          <div className="grid gap-1">
            <Label htmlFor="url">URL</Label>

            <Input
              id="url"
              value={getDisplayValue('url', '')}
              onChange={(e) => updateState('url', e.target.value)}
              placeholder="https://github.com"
            />
          </div>
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
