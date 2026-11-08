'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/api-client';
import { ACTION, FIELD, SELECT } from './styles';

export function AddTodoForm({
  projects,
  defaultProjectId,
}: {
  projects: { id: string; name: string }[];
  defaultProjectId: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    const projectId = String(form.get('projectId') ?? '');

    setPending(true);
    setError(null);
    const result = await apiRequest('/api/todos', {
      method: 'POST',
      body: { title: form.get('title'), projectId: projectId || null },
    });
    setPending(false);

    if (!result.ok) {
      setError(result.fieldErrors.title ?? result.message);
      return;
    }
    if (inputRef.current) inputRef.current.value = '';
    inputRef.current?.focus();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2" noValidate>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          ref={inputRef}
          name="title"
          aria-label="New todo"
          placeholder="Add a todo"
          maxLength={280}
          autoComplete="off"
          className={`${FIELD} sm:flex-1`}
        />
        {projects.length > 0 && (
          <select
            // Follows the active filter when the URL changes.
            key={defaultProjectId ?? 'none'}
            name="projectId"
            aria-label="Project"
            defaultValue={defaultProjectId ?? ''}
            className={SELECT}
          >
            <option value="">No project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        )}
        <Button type="submit" className={ACTION}>
          Add
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
