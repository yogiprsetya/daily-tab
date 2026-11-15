'use client';

import Link from 'next/link';
import { LoadError } from '@/components/load-error';
import { useHomeTodos, useProjects } from '../hooks';
import { toItem } from '../optimistic';
import { TodoList } from './todo-list';
import { PendingSkeleton } from './todos-skeleton';

/** Reads the same caches as /todos, so a tick here is reflected there too. */
export function PendingSection() {
  const todos = useHomeTodos();
  const projects = useProjects();

  if (todos.error) return <LoadError message={todos.error.message} />;
  if (!todos.data) return <PendingSkeleton />;

  const total = projects.data?.total;
  const pending = todos.data.items;

  return (
    <>
      <div className="flex min-h-11 items-center justify-between gap-2">
        <h2
          id="pending-heading"
          className="text-base font-medium tracking-tight"
        >
          Pending tasks
        </h2>
        <Link
          href="/todos"
          className="-mr-3 flex min-h-11 items-center rounded-lg px-3 text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          View all{total === undefined ? '' : ` (${total})`}
        </Link>
      </div>
      <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
        <TodoList pending={pending.map(toItem)} completed={[]} />
      </div>
    </>
  );
}
