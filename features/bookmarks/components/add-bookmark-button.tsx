'use client';

import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ACTION } from '@/components/form-styles';
import { Button } from '@/components/ui/button';
import { BookmarkDialog } from './bookmark-dialog';
import type { FolderOption } from './types';

export function AddBookmarkButton({
  folders,
  defaultFolderId,
}: {
  folders: FolderOption[];
  defaultFolderId: string | null;
}) {
  const router = useRouter();
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
            router.refresh();
          }}
        />
      )}
    </>
  );
}
