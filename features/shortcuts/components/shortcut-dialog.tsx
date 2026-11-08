'use client';

import { type FormEvent, useState } from 'react';
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
import type { ShortcutItem } from './types';

const FIELD = 'h-11 rounded-lg px-3 text-base sm:text-sm';
const ACTION = 'h-11 rounded-lg px-4 text-sm';

/** Mount per use (with a key): form state starts fresh every time it opens. */
export function ShortcutDialog({
  shortcut,
  onClose,
  onSaved,
}: {
  shortcut: ShortcutItem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = { title: form.get('title'), url: form.get('url') };

    setPending(true);
    setError(null);
    setFieldErrors({});
    const result = shortcut
      ? await apiRequest(`/api/shortcuts/${shortcut.id}`, {
          method: 'PATCH',
          body,
        })
      : await apiRequest('/api/shortcuts', { method: 'POST', body });
    setPending(false);

    if (result.ok) return onSaved();
    setFieldErrors(result.fieldErrors);
    if (Object.keys(result.fieldErrors).length === 0) setError(result.message);
  }

  async function onDelete() {
    if (!shortcut) return;
    if (!confirmingDelete) return setConfirmingDelete(true);

    setPending(true);
    setError(null);
    const result = await apiRequest(`/api/shortcuts/${shortcut.id}`, {
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
            {shortcut ? 'Edit shortcut' : 'Add shortcut'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-2">
            <Label htmlFor="shortcut-title" className="text-sm">
              Title
            </Label>
            <Input
              id="shortcut-title"
              name="title"
              defaultValue={shortcut?.title}
              maxLength={80}
              autoComplete="off"
              autoFocus
              aria-invalid={Boolean(fieldErrors.title)}
              aria-describedby={
                fieldErrors.title ? 'shortcut-title-error' : undefined
              }
              className={FIELD}
            />
            {fieldErrors.title && (
              <p id="shortcut-title-error" className="text-sm text-destructive">
                {fieldErrors.title}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="shortcut-url" className="text-sm">
              URL
            </Label>
            <Input
              id="shortcut-url"
              name="url"
              defaultValue={shortcut?.url}
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
              placeholder="github.com"
              aria-invalid={Boolean(fieldErrors.url)}
              aria-describedby={
                fieldErrors.url ? 'shortcut-url-error' : undefined
              }
              className={FIELD}
            />
            {fieldErrors.url && (
              <p id="shortcut-url-error" className="text-sm text-destructive">
                {fieldErrors.url}
              </p>
            )}
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-end gap-2">
            {shortcut && (
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
