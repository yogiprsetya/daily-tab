'use client';

import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ACTION } from '@/components/form-styles';
import { Button } from '@/components/ui/button';
import { TodoDialog } from './todo-dialog';

export function AddTodoButton({
  projects,
  defaultProjectId,
}: {
  projects: { id: string; name: string }[];
  defaultProjectId: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className={`${ACTION} w-full sm:w-auto sm:self-start`}
      >
        <Plus aria-hidden />
        Add todo
      </Button>
      {open && (
        <TodoDialog
          todo={null}
          defaultProjectId={defaultProjectId}
          projects={projects}
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
