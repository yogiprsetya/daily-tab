'use client';

import Link from 'next/link';
import { LoadError } from '@/components/load-error';
import { useProjects, useTodos } from '../hooks';
import { toItem } from '../optimistic';
import { SECTION_HEADING } from './styles';
import { TodoList } from './todo-list';
import { PendingSkeleton } from './todos-skeleton';

const HOME_LIMIT = 5;

/** Reads the same caches as /todos, so a tick here is reflected there too. */
export function PendingSection() {
  const todos = useTodos({ kind: 'all' });
  const projects = useProjects();

  if (todos.error) return <LoadError message={todos.error.message} />;
  if (!todos.data || !projects.data) return <PendingSkeleton />;

  const total = projects.data.total;
  const pending = todos.data.items
    .filter((row) => row.completedAt === null)
    .slice(0, HOME_LIMIT);

  return (
    <>
      <div className="flex min-h-11 items-center justify-between gap-2">
        <h2 id="pending-heading" className={SECTION_HEADING}>
          Pending tasks
        </h2>
        <Link
          href="/todos"
          className="-mr-3 flex min-h-11 items-center rounded-lg px-3 text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          View all ({total})
        </Link>
      </div>
      <TodoList pending={pending.map(toItem)} completed={[]} />
    </>
  );
}
