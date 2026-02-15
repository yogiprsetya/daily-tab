import { useEffect, useRef } from 'react';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogClose,
} from '~/components/ui/dialog';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import type { PendingItem, PendingType } from '~/types/pending';
import { useDialogState } from '~/hooks/use-dialog-state';
import { showAlert } from '~/components/ui/alert-provider';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: PendingItem | null;
  onSave: (data: { title: string; type: PendingType; url?: string }) => void;
  onDelete?: (id: string) => void;
};

export const PendingDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  editing,
  onSave,
  onDelete,
}) => {
  const { resetState, updateState, getDisplayValue } = useDialogState(editing);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && titleRef.current) {
      setTimeout(() => titleRef.current?.focus(), 0);
    }
  }, [open]);

  const handleSave = () => {
    const t = String(getDisplayValue('title', '')).trim();
    const type = (getDisplayValue('type', 'other') as PendingType) || 'other';
    const url = String(getDisplayValue('url', '')).trim() || undefined;
    if (!t) return;
    onSave({ title: t, type, url });
    onOpenChange(false);
    resetState();
  };

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) resetState();
  };

  const handleDelete = async () => {
    if (!editing || !onDelete) return;
    onDelete(editing.id);
    await showAlert('Pending item deleted');
    onOpenChange(false);
    resetState();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="space-y-3 mt-4">
          <div className="grid gap-1">
            <Label htmlFor="pending-title">Title</Label>

            <Input
              id="pending-title"
              ref={titleRef}
              value={getDisplayValue('title', '')}
              onChange={(e) => updateState('title', e.target.value)}
              placeholder="Item title"
            />
          </div>

          <div className="grid gap-1">
            <Label htmlFor="pending-type">Type</Label>

            <Select
              value={getDisplayValue('type', 'other') as string}
              onValueChange={(v) => updateState('type', v as PendingType)}
            >
              <SelectTrigger id="pending-type" className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="blog">Blog</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="article">Article</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1">
            <Label htmlFor="pending-url">URL (optional)</Label>

            <Input
              id="pending-url"
              value={getDisplayValue('url', '')}
              onChange={(e) => updateState('url', e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>

        <DialogFooter className="pt-4">
          {editing && onDelete ? (
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          ) : null}

          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>

          <Button onClick={handleSave}>{editing ? 'Update' : 'Create'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
