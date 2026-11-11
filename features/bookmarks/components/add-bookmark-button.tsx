'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';
import { ACTION } from '@/components/form-styles';
import { Button } from '@/components/ui/button';
import { useBookmarksInvalidate } from '../hooks';
import { BookmarkDialog } from './bookmark-dialog';
import type { FolderOption } from './types';

export function AddBookmarkButton({
  folders,
  defaultFolderId,
}: {
  folders: FolderOption[];
  defaultFolderId: string | null;
}) {
  const invalidate = useBookmarksInvalidate();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className={`${ACTION} shrink-0`}
      >
        <Plus aria-hidden />
        Add bookmark
      </Button>

      {open && (
        <BookmarkDialog
          bookmark={null}
          defaultFolderId={defaultFolderId}
          folders={folders}
          onClose={() => setOpen(false)}
          onSaved={() => {
            setOpen(false);
            invalidate();
          }}
        />
      )}
    </>
  );
}
