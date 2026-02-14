import { useEffect, useRef, useState } from 'react';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogClose,
} from '~/components/ui/dialog';
import { Input } from '~/components/ui/input';
import type { Note } from '~/types/notes';

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
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // Use editing values if available, otherwise use local state
  const displayTitle = editing ? editing.title : title;
  const displayContent = editing ? editing.content : content;

  // Auto-focus content when dialog opens
  useEffect(() => {
    if (open && contentRef.current) {
      setTimeout(() => contentRef.current?.focus(), 0);
    }
  }, [open]);

  const handleSave = () => {
    const t = (editing ? displayTitle : title).trim();
    const c = (editing ? displayContent : content).trim();
    if (!t || !c) return;
    onSave({ title: t, content: c });
    onOpenChange(false);
    setTitle('');
    setContent('');
  };

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setTitle('');
      setContent('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-5xl h-[92vh] flex flex-col p-0">
        {/* Minimal header with title input */}
        <div className="px-6 pt-6 pb-0 border-b border-border/50">
          <Input
            id="note-title"
            value={displayTitle}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="text-xl font-semibold h-auto border-0 bg-transparent px-0 py-2 focus-visible:ring-0 placeholder:text-muted-foreground/50"
          />
        </div>

        {/* Content area - main focus */}
        <div className="flex-1 overflow-hidden flex flex-col px-6 py-4">
          <textarea
            ref={contentRef}
            id="note-content"
            value={displayContent}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start typing..."
            className="flex-1 w-full bg-transparent text-base leading-relaxed resize-none border-0 focus-visible:outline-none focus-visible:ring-0 placeholder:text-muted-foreground/40 font-normal"
            style={{
              fontFamily: 'inherit',
            }}
          />
          {/* Word count - subtle hint */}
          <div className="text-xs text-muted-foreground/50 mt-4 pt-2 border-t border-border/30">
            {displayContent.trim().split(/\s+/).filter(Boolean).length} words •{' '}
            {displayContent.length} characters
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
