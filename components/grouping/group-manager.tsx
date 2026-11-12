'use client';

import { Check, Pencil, Settings2, Trash2, X } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { ACTION, FIELD, ICON_BUTTON } from '@/components/form-styles';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/api-client';
import { useInvalidate } from '@/lib/swr/invalidation';
import type { Feature } from '@/lib/swr/keys';
import { cn } from '@/lib/utils';

type Group = { id: string; name: string };

export type GroupManagerCopy = {
  trigger: string;
  title: string;
  description: string;
  placeholder: string;
  newNameLabel: string;
};

function RenameRow({
  group,
  pending,
  onSubmit,
  onCancel,
}: {
  group: Group;
  pending: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  return (
    <li>
      <form onSubmit={onSubmit} className="flex items-center gap-1" noValidate>
        <Input
          name="name"
          aria-label={`Rename ${group.name}`}
          defaultValue={group.name}
          maxLength={50}
          autoComplete="off"
          autoFocus
          className={cn(FIELD, 'flex-1')}
        />
        <button
          type="submit"
          disabled={pending}
          aria-label="Save name"
          className={ICON_BUTTON}
        >
          <Check aria-hidden className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Cancel rename"
          onClick={onCancel}
          className={ICON_BUTTON}
        >
          <X aria-hidden className="size-4" />
        </button>
      </form>
    </li>
  );
}

function GroupRow({
  group,
  pending,
  confirmingDelete,
  onRename,
  onDelete,
}: {
  group: Group;
  pending: boolean;
  confirmingDelete: boolean;
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="flex items-center gap-1">
      <span className="min-w-0 flex-1 truncate text-sm">{group.name}</span>
      {confirmingDelete ? (
        <button
          type="button"
          disabled={pending}
          onClick={onDelete}
          className="min-h-11 rounded-lg px-3 text-sm text-destructive outline-none hover:bg-destructive/10 focus-visible:ring-2 focus-visible:ring-ring"
        >
          Press again to delete
        </button>
      ) : (
        <>
          <button
            type="button"
            aria-label={`Rename ${group.name}`}
            onClick={onRename}
            className={ICON_BUTTON}
          >
            <Pencil aria-hidden className="size-4" />
          </button>
          <button
            type="button"
            aria-label={`Delete ${group.name}`}
            onClick={onDelete}
            className={ICON_BUTTON}
          >
            <Trash2 aria-hidden className="size-4" />
          </button>
        </>
      )}
    </li>
  );
}

export function GroupManager({
  feature,
  itemFeature,
  endpoint,
  groups,
  copy,
}: {
  /** Cache group holding the groups themselves. */
  feature: Feature;
  /** Cache group holding the items, whose group names and counts also change. */
  itemFeature: Feature;
  endpoint: string;
  groups: Group[];
  copy: GroupManagerCopy;
}) {
  const invalidate = useInvalidate();
  const [open, setOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function request(path: string, method: string, body?: unknown) {
    setPending(true);
    setError(null);
    const result = await apiRequest(path, { method, body });
    setPending(false);

    if (result.ok) {
      // Deleting a group moves its items to "No group", so both change.
      invalidate(feature, itemFeature);
      return true;
    }
    setError(result.fieldErrors.name ?? result.message);
    return false;
  }

  async function onAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const name = new FormData(formElement).get('name');
    if (await request(endpoint, 'POST', { name })) formElement.reset();
  }

  async function onRename(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const name = new FormData(event.currentTarget).get('name');
    if (await request(`${endpoint}/${id}`, 'PATCH', { name })) {
      setRenamingId(null);
    }
  }

  async function onDelete(id: string) {
    if (confirmingId !== id) return setConfirmingId(id);
    if (await request(`${endpoint}/${id}`, 'DELETE')) setConfirmingId(null);
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)} variant="link">
        <Settings2 aria-hidden className="size-4" />
        {copy.trigger}
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            setRenamingId(null);
            setConfirmingId(null);
            setError(null);
          }
        }}
      >
        <DialogContent className="rounded-lg p-5 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">{copy.title}</DialogTitle>
            <DialogDescription className="text-sm">
              {copy.description}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onAdd} className="flex gap-2" noValidate>
            <Input
              name="name"
              aria-label={copy.newNameLabel}
              placeholder={copy.placeholder}
              maxLength={50}
              autoComplete="off"
              className={cn(FIELD, 'flex-1')}
            />
            <Button type="submit" disabled={pending} className={ACTION}>
              Add
            </Button>
          </form>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          {groups.length > 0 && (
            <ul className="flex max-h-72 flex-col overflow-y-auto">
              {groups.map((group) =>
                renamingId === group.id ? (
                  <RenameRow
                    key={group.id}
                    group={group}
                    pending={pending}
                    onSubmit={(event) => onRename(event, group.id)}
                    onCancel={() => setRenamingId(null)}
                  />
                ) : (
                  <GroupRow
                    key={group.id}
                    group={group}
                    pending={pending}
                    confirmingDelete={confirmingId === group.id}
                    onRename={() => {
                      setError(null);
                      setRenamingId(group.id);
                    }}
                    onDelete={() => onDelete(group.id)}
                  />
                )
              )}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
