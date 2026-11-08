'use client';

import { ExternalLink, Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useOptimistic, useState, useTransition } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { ICON_BUTTON } from '@/components/form-styles';
import { apiRequest } from '@/lib/api-client';
import { displayHost } from '@/lib/url';
import { cn } from '@/lib/utils';
import { type TodoItem, type TodoLists, applyToggle } from '../optimistic';
import { TodoDialog } from './todo-dialog';

function TodoRow({
  todo,
  completed,
  showNotes,
  onToggle,
  onEdit,
}: {
  todo: TodoItem;
  completed: boolean;
  showNotes: boolean;
  onToggle: () => void;
  onEdit?: () => void;
}) {
  const hasDetails = todo.url !== null || (showNotes && todo.notes !== null);

  return (
    <li className="flex min-w-0 items-center">
      <div className="flex min-w-0 flex-1 flex-col">
        <label className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-4 rounded-lg px-1 py-2.5 text-sm has-focus-visible:ring-2 has-focus-visible:ring-ring">
          <Checkbox
            checked={completed}
            onCheckedChange={onToggle}
            className="size-5 rounded-md"
          />
          <span className="flex min-w-0 flex-col gap-0.5">
            <span
              className={cn(
                'wrap-anywhere',
                completed && 'text-muted-foreground line-through'
              )}
            >
              {todo.title}
            </span>
            {todo.projectName && (
              <span className="text-xs text-muted-foreground">
                {todo.projectName}
              </span>
            )}
          </span>
        </label>
        {/* Outside the label, so opening the link does not tick the todo. */}
        {hasDetails && (
          <div className="flex min-w-0 flex-col items-start gap-1 pb-2.5 pl-10 text-xs text-muted-foreground">
            {todo.url && (
              <a
                href={todo.url}
                target="_blank"
                rel="noreferrer"
                className="flex max-w-full min-w-0 items-center gap-1 rounded underline-offset-2 outline-none hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ExternalLink aria-hidden className="size-3 shrink-0" />
                <span className="truncate">{displayHost(todo.url)}</span>
              </a>
            )}
            {showNotes && todo.notes && (
              <p className="line-clamp-3 wrap-anywhere whitespace-pre-line">
                {todo.notes}
              </p>
            )}
          </div>
        )}
      </div>
      {onEdit && (
        <button
          type="button"
          aria-label={`Edit ${todo.title}`}
          onClick={onEdit}
          className={ICON_BUTTON}
        >
          <Pencil aria-hidden className="size-4" />
        </button>
      )}
    </li>
  );
}

/** Pass `projects` to allow editing; without it rows only tick (Home). */
export function TodoList({
  pending,
  completed,
  projects,
  emptyLabel = 'Nothing pending.',
}: TodoLists & {
  projects?: { id: string; name: string }[];
  emptyLabel?: string;
}) {
  const router = useRouter();
  const [lists, toggleOptimistic] = useOptimistic(
    { pending, completed },
    applyToggle
  );
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<TodoItem | null>(null);

  function toggle(todo: TodoItem, nextCompleted: boolean) {
    setError(null);
    startTransition(async () => {
      toggleOptimistic({ id: todo.id, completed: nextCompleted });
      const result = await apiRequest(`/api/todos/${todo.id}`, {
        method: 'PATCH',
        body: { completed: nextCompleted },
      });
      // Inside the transition, so the optimistic state holds until fresh data lands.
      if (result.ok) router.refresh();
      else setError(result.message);
    });
  }

  const onEdit = (todo: TodoItem) =>
    projects ? () => setEditing(todo) : undefined;

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {lists.pending.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <ul className="flex flex-col">
          {lists.pending.map((todo) => (
            <TodoRow
              key={todo.id}
              todo={todo}
              completed={false}
              showNotes={Boolean(projects)}
              onToggle={() => toggle(todo, true)}
              onEdit={onEdit(todo)}
            />
          ))}
        </ul>
      )}

      {lists.completed.length > 0 && (
        <details className="group">
          <summary className="flex min-h-11 cursor-pointer items-center rounded-lg text-sm text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Completed ({lists.completed.length})
          </summary>
          <ul className="flex flex-col">
            {lists.completed.map((todo) => (
              <TodoRow
                key={todo.id}
                todo={todo}
                completed
                showNotes={Boolean(projects)}
                onToggle={() => toggle(todo, false)}
                onEdit={onEdit(todo)}
              />
            ))}
          </ul>
        </details>
      )}

      {editing && projects && (
        <TodoDialog
          key={editing.id}
          todo={editing}
          projects={projects}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
