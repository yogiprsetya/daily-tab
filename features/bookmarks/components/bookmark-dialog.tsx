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
import type { BookmarkItem, FolderOption } from './types';

/** `bookmark` is null when creating; `defaultFolderId` only applies then. */
export function BookmarkDialog({
  bookmark,
  defaultFolderId = null,
  folders,
  onClose,
  onSaved,
}: {
  bookmark: BookmarkItem | null;
  defaultFolderId?: string | null;
  folders: FolderOption[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = {
      title: form.get('title'),
      url: form.get('url'),
      notes: form.get('notes'),
      folderId: readGroupId(form, 'folderId'),
    };

    setPending(true);
    setError(null);
    const result = bookmark
      ? await apiRequest(`/api/bookmarks/${bookmark.id}`, {
          method: 'PATCH',
          body,
        })
      : await apiRequest('/api/bookmarks', { method: 'POST', body });
    setPending(false);

    if (result.ok) return onSaved();
    setError(
      result.fieldErrors.title ??
        result.fieldErrors.url ??
        result.fieldErrors.notes ??
        result.fieldErrors.folderId ??
        result.message
    );
  }

  async function onDelete() {
    if (!bookmark) return;
    if (!confirmingDelete) return setConfirmingDelete(true);

    setPending(true);
    setError(null);
    const result = await apiRequest(`/api/bookmarks/${bookmark.id}`, {
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
            {bookmark ? 'Edit bookmark' : 'Add bookmark'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-2">
            <Label htmlFor="bookmark-title" className="text-sm">
              Title
            </Label>
            <Input
              id="bookmark-title"
              name="title"
              defaultValue={bookmark?.title}
              maxLength={120}
              autoComplete="off"
              autoFocus
              className={FIELD}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="bookmark-url" className="text-sm">
              URL
            </Label>
            <Input
              id="bookmark-url"
              name="url"
              defaultValue={bookmark?.url}
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
            <Label htmlFor="bookmark-folder" className="text-sm">
              Folder
            </Label>
            <GroupSelect
              id="bookmark-folder"
              name="folderId"
              noneLabel="No folder"
              defaultGroupId={bookmark ? bookmark.folderId : defaultFolderId}
              groups={folders}
              className="w-full"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="bookmark-notes" className="text-sm">
              Note (optional)
            </Label>
            <Textarea
              id="bookmark-notes"
              name="notes"
              defaultValue={bookmark?.notes ?? ''}
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
            {bookmark && (
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
