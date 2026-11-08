'use client';

import { type FormEvent, useState } from 'react';
import { ACTION, FIELD } from '@/components/form-styles';
import { GroupSelect, readGroupId } from '@/components/grouping/group-select';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiRequest } from '@/lib/api-client';
import type { TodoItem } from '../optimistic';

/** `todo` is null when creating; `defaultProjectId` only applies then. */
export function TodoDialog({
  todo,
  defaultProjectId = null,
  projects,
  onClose,
  onSaved,
}: {
  todo: TodoItem | null;
  defaultProjectId?: string | null;
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
    const body = {
      title: form.get('title'),
      projectId: readGroupId(form, 'projectId'),
      url: form.get('url'),
      notes: form.get('notes'),
    };
    const result = todo
      ? await apiRequest(`/api/todos/${todo.id}`, { method: 'PATCH', body })
      : await apiRequest('/api/todos', { method: 'POST', body });
    setPending(false);

    if (result.ok) return onSaved();
    setError(
      result.fieldErrors.title ??
        result.fieldErrors.url ??
        result.fieldErrors.notes ??
        result.fieldErrors.projectId ??
        result.message
    );
  }

  async function onDelete() {
    if (!todo) return;
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
          <DialogTitle className="text-base">
            {todo ? 'Edit todo' : 'Add todo'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-2">
            <Label htmlFor="todo-title" className="text-sm">
              Title
            </Label>
            <Input
              id="todo-title"
              name="title"
              defaultValue={todo?.title}
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
            <GroupSelect
              id="todo-project"
              name="projectId"
              noneLabel="No project"
              defaultGroupId={todo ? todo.projectId : defaultProjectId}
              groups={projects}
              className="w-full"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="todo-url" className="text-sm">
              Link (optional)
            </Label>
            <Input
              id="todo-url"
              name="url"
              defaultValue={todo?.url ?? ''}
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
              placeholder="example.com/page"
              className={FIELD}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="todo-notes" className="text-sm">
              Notes (optional)
            </Label>
            <Textarea
              id="todo-notes"
              name="notes"
              defaultValue={todo?.notes ?? ''}
              maxLength={2000}
              rows={3}
              className="min-h-20 rounded-lg px-3 py-2 text-base sm:text-sm md:text-sm"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-end gap-2">
            {todo && (
              <Button
                type="button"
                variant="destructive"
                disabled={pending}
                onClick={onDelete}
                className={`${ACTION} mr-auto`}
              >
                {confirmingDelete ? 'Press again to delete' : 'Delete'}
              </Button>
            )}
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
