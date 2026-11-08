'use client';

import { Check, Pencil, Settings2, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { ACTION, FIELD } from '@/components/form-styles';
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
import { cn } from '@/lib/utils';
import { ICON_BUTTON } from './styles';

type Project = { id: string; name: string };

function RenameRow({
  project,
  pending,
  onSubmit,
  onCancel,
}: {
  project: Project;
  pending: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  return (
    <li>
      <form onSubmit={onSubmit} className="flex items-center gap-1" noValidate>
        <Input
          name="name"
          aria-label={`Rename ${project.name}`}
          defaultValue={project.name}
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

function ProjectRow({
  project,
  pending,
  confirmingDelete,
  onRename,
  onDelete,
}: {
  project: Project;
  pending: boolean;
  confirmingDelete: boolean;
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="flex items-center gap-1">
      <span className="min-w-0 flex-1 truncate text-sm">{project.name}</span>
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
            aria-label={`Rename ${project.name}`}
            onClick={onRename}
            className={ICON_BUTTON}
          >
            <Pencil aria-hidden className="size-4" />
          </button>
          <button
            type="button"
            aria-label={`Delete ${project.name}`}
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

export function ProjectManager({ projects }: { projects: Project[] }) {
  const router = useRouter();
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
      router.refresh();
      return true;
    }
    setError(result.fieldErrors.name ?? result.message);
    return false;
  }

  async function onAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const name = new FormData(formElement).get('name');
    if (await request('/api/projects', 'POST', { name })) formElement.reset();
  }

  async function onRename(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const name = new FormData(event.currentTarget).get('name');
    if (await request(`/api/projects/${id}`, 'PATCH', { name })) {
      setRenamingId(null);
    }
  }

  async function onDelete(id: string) {
    if (confirmingId !== id) return setConfirmingId(id);
    if (await request(`/api/projects/${id}`, 'DELETE')) setConfirmingId(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-11 items-center gap-2 self-start rounded-lg text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Settings2 aria-hidden className="size-4" />
        Manage projects
      </button>

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
            <DialogTitle className="text-base">Projects</DialogTitle>
            <DialogDescription className="text-sm">
              Deleting a project keeps its todos; they move to No project.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onAdd} className="flex gap-2" noValidate>
            <Input
              name="name"
              aria-label="New project name"
              placeholder="New project"
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

          {projects.length > 0 && (
            <ul className="flex max-h-72 flex-col overflow-y-auto">
              {projects.map((project) =>
                renamingId === project.id ? (
                  <RenameRow
                    key={project.id}
                    project={project}
                    pending={pending}
                    onSubmit={(event) => onRename(event, project.id)}
                    onCancel={() => setRenamingId(null)}
                  />
                ) : (
                  <ProjectRow
                    key={project.id}
                    project={project}
                    pending={pending}
                    confirmingDelete={confirmingId === project.id}
                    onRename={() => {
                      setError(null);
                      setRenamingId(project.id);
                    }}
                    onDelete={() => onDelete(project.id)}
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
