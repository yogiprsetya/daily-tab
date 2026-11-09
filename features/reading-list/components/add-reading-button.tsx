'use client';

import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ACTION } from '@/components/form-styles';
import { Button } from '@/components/ui/button';
import { ReadingDialog } from './reading-dialog';

export function AddReadingButton({
  topics,
  defaultTopicId,
}: {
  topics: { id: string; name: string }[];
  defaultTopicId: string | null;
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
        Add link
      </Button>

      {open && (
        <ReadingDialog
          defaultTopicId={defaultTopicId}
          topics={topics}
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
