'use client';

import { type FormEvent, useState } from 'react';
import { ACTION, FIELD } from '@/components/form-styles';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiRequest } from '@/lib/api-client';
import type { TodoItem } from '../optimistic';
import { ProjectSelect, readProjectId } from './project-select';

export function TodoDialog({
  todo,
  projects,
  onClose,
  onSaved,
}: {
  todo: TodoItem;
  projects: { id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    setPending(true);
    setError(null);
    const result = await apiRequest(`/api/todos/${todo.id}`, {
      method: 'PATCH',
      body: { title: form.get('title'), projectId: readProjectId(form) },
    });
    setPending(false);

    if (result.ok) return onSaved();
    setError(
      result.fieldErrors.title ?? result.fieldErrors.projectId ?? result.message
    );
  }

  async function onDelete() {
    if (!confirmingDelete) return setConfirmingDelete(true);

    setPending(true);
    setError(null);
    const result = await apiRequest(`/api/todos/${todo.id}`, {
      method: 'DELETE',
    });
    setPending(false);

    if (result.ok) return onSaved();
    setError(result.message);
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-lg p-5 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Edit todo</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-2">
            <Label htmlFor="todo-title" className="text-sm">
              Title
            </Label>
            <Input
              id="todo-title"
              name="title"
              defaultValue={todo.title}
              maxLength={280}
              autoComplete="off"
              autoFocus
              className={FIELD}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="todo-project" className="text-sm">
              Project
            </Label>
            <ProjectSelect
              id="todo-project"
              defaultProjectId={todo.projectId}
              projects={projects}
              className="w-full"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={onDelete}
              className={`${ACTION} mr-auto`}
            >
              {confirmingDelete ? 'Press again to delete' : 'Delete'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className={ACTION}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending} className={ACTION}>
              {pending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
