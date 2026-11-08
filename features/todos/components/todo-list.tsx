'use client';

import { Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useOptimistic, useState, useTransition } from 'react';
import { apiRequest } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { type TodoItem, type TodoLists, applyToggle } from '../optimistic';
import { ICON_BUTTON } from './styles';
import { TodoDialog } from './todo-dialog';

function TodoRow({
  todo,
  completed,
  onToggle,
  onEdit,
}: {
  todo: TodoItem;
  completed: boolean;
  onToggle: () => void;
  onEdit?: () => void;
}) {
  return (
    <li className="flex min-w-0 items-start">
      <label className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-start gap-3 rounded-lg px-1 py-2.5 text-sm has-focus-visible:ring-2 has-focus-visible:ring-ring">
        <input
          type="checkbox"
          checked={completed}
          onChange={onToggle}
          className="mt-0.5 size-5 shrink-0 cursor-pointer accent-primary outline-none"
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
