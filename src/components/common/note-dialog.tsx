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
import { useAutoFocus } from '~/hooks/use-auto-focus';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Note | null;
  onSave: (data: { title: string; content: string }) => void;
  onAutoSave?: (data: { title: string; content: string }) => void;
};

export const NoteDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  editing,
  onSave,
  onAutoSave,
}) => {
  const { resetState, updateState, getDisplayValue } = useDialogState(editing);
  const contentRef = useAutoFocus<HTMLTextAreaElement>(open);

  // Track last saved values to avoid repeated autosaves on identical content
  const lastSavedRef = useRef<{ title: string; content: string }>({
    title: editing?.title ?? '',
    content: editing?.content ?? '',
  });

  // Keep ref in sync when switching notes or opening dialog
  useEffect(() => {
    lastSavedRef.current = {
      title: editing?.title ?? '',
      content: editing?.content ?? '',
    };
  }, [editing, open]);

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

  const titleValue = String(getDisplayValue('title', ''));
  const contentValue = String(getDisplayValue('content', ''));
  const wordCount = contentValue.trim()
    ? contentValue.trim().split(/\s+/).filter(Boolean).length
    : 0;
  const charCount = contentValue.length;

  // Auto-save when user is idle while editing an existing note
  useEffect(() => {
    if (!editing) return; // Only autosave updates, not new note creation

    const t = titleValue.trim();
    const c = contentValue.trim();

    // Skip if nothing changed or fields are empty
    const last = lastSavedRef.current;
    const changed = t !== last.title || c !== last.content;
    if (!changed) return;
    if (!t || !c) return;

    const id = window.setTimeout(() => {
      // Save without closing the dialog
      if (typeof onAutoSave === 'function') {
        onAutoSave({ title: t, content: c });
        lastSavedRef.current = { title: t, content: c };
      }
    }, 1000);

    return () => clearTimeout(id);
  }, [editing, titleValue, contentValue, onAutoSave]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-5xl h-[92vh] flex flex-col p-0">
        <div className="px-6 pt-6 pb-0 border-b border-border/50">
          <Input
            id="note-title"
            value={titleValue}
            onChange={(e) => updateState('title', e.target.value)}
            placeholder="Title"
            className="text-lg font-semibold h-auto border-0 bg-transparent px-0 py-2 focus-visible:outline-none focus-visible:ring-0 placeholder:text-muted-foreground/50"
          />
        </div>

        <div className="flex-1 overflow-hidden flex flex-col px-6 py-4">
          <textarea
            ref={contentRef}
            id="note-content"
            value={getDisplayValue('content', '')}
            onChange={(e) => updateState('content', e.target.value)}
            placeholder="Start typing..."
            className="flex-1 w-full bg-transparent leading-relaxed resize-none focus-visible:outline-none focus-visible:ring-0 placeholder:text-muted-foreground/40 font-normal"
          />

          <div className="text-xs text-muted-foreground mt-4 pt-2 border-t border-border/30">
            {wordCount} words • {charCount} characters
          </div>
        </div>

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
