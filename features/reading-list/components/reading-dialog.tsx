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
import type { ReadingItem } from '../optimistic';

/** `item` is null when creating; `defaultTopicId` only applies then. */
export function ReadingDialog({
  item,
  defaultTopicId = null,
  topics,
  onClose,
  onSaved,
}: {
  item: ReadingItem | null;
  defaultTopicId?: string | null;
  topics: { id: string; name: string }[];
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
      topicId: readGroupId(form, 'topicId'),
    };

    setPending(true);
    setError(null);
    const result = item
      ? await apiRequest(`/api/reading-items/${item.id}`, {
          method: 'PATCH',
          body,
        })
      : await apiRequest('/api/reading-items', { method: 'POST', body });
    setPending(false);

    if (result.ok) return onSaved();
    setError(
      result.fieldErrors.title ??
        result.fieldErrors.url ??
        result.fieldErrors.notes ??
        result.fieldErrors.topicId ??
        result.message
    );
  }

  async function onDelete() {
    if (!item) return;
    if (!confirmingDelete) return setConfirmingDelete(true);

    setPending(true);
    setError(null);
    const result = await apiRequest(`/api/reading-items/${item.id}`, {
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
            {item ? 'Edit link' : 'Add link'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-2">
            <Label htmlFor="reading-title" className="text-sm">
              Title
            </Label>
            <Input
              id="reading-title"
              name="title"
              defaultValue={item?.title}
              maxLength={120}
              autoComplete="off"
              autoFocus
              className={FIELD}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="reading-url" className="text-sm">
              URL
            </Label>
            <Input
              id="reading-url"
              name="url"
              defaultValue={item?.url}
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
              placeholder="example.com/article"
              className={FIELD}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="reading-topic" className="text-sm">
              Topic
            </Label>
            <GroupSelect
              id="reading-topic"
              name="topicId"
              noneLabel="No topic"
              defaultGroupId={item ? item.topicId : defaultTopicId}
              groups={topics}
              className="w-full"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="reading-notes" className="text-sm">
              Note (optional)
            </Label>
            <Textarea
              id="reading-notes"
              name="notes"
              defaultValue={item?.notes ?? ''}
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
            {item && (
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
