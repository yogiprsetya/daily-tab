import { useEffect, useRef } from 'react';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogClose,
} from '~/components/ui/dialog';
import { Input } from '~/components/ui/input';
import type { Note } from '~/types/notes';
import { useDialogState } from '~/hooks/use-dialog-state';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Note | null;
  onSave: (data: { title: string; content: string }) => void;
};

export const NoteDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  editing,
  onSave,
}) => {
  const { resetState, updateState, getDisplayValue } = useDialogState(editing);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus content when dialog opens
  useEffect(() => {
    if (open && contentRef.current) {
      setTimeout(() => contentRef.current?.focus(), 0);
    }
  }, [open]);

  const handleSave = () => {
    const t = getDisplayValue('title', '').trim();
    const c = getDisplayValue('content', '').trim();
    if (!t || !c) return;
    onSave({ title: t, content: c });
    onOpenChange(false);
    resetState();
  };

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) resetState();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-5xl h-[92vh] flex flex-col p-0">
        {/* Minimal header with title input */}
        <div className="px-6 pt-6 pb-0 border-b border-border/50">
          <Input
            id="note-title"
            value={getDisplayValue('title', '')}
            onChange={(e) => updateState('title', e.target.value)}
            placeholder="Title"
            className="text-xl font-semibold h-auto border-0 bg-transparent px-0 py-2 focus-visible:ring-0 placeholder:text-muted-foreground/50"
          />
        </div>

        {/* Content area - main focus */}
        <div className="flex-1 overflow-hidden flex flex-col px-6 py-4">
          <textarea
            ref={contentRef}
            id="note-content"
            value={getDisplayValue('content', '')}
            onChange={(e) => updateState('content', e.target.value)}
            placeholder="Start typing..."
            className="flex-1 w-full bg-transparent text-base leading-relaxed resize-none border-0 focus-visible:outline-none focus-visible:ring-0 placeholder:text-muted-foreground/40 font-normal"
          />
          {/* Word count - subtle hint */}
          <div className="text-xs text-muted-foreground/50 mt-4 pt-2 border-t border-border/30">
            {
              getDisplayValue('content', '').trim().split(/\s+/).filter(Boolean)
                .length
            }{' '}
            words • {getDisplayValue('content', '').length} characters
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t border-border/50">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave}>{editing ? 'Update' : 'Create'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
