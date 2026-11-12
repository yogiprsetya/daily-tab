import type { Metadata } from 'next';
import { Suspense } from 'react';
import { requirePageSession } from '@/features/auth/require-session';
import { TodosSkeleton } from '@/features/todos/components/todos-skeleton';
import { TodosView } from '@/features/todos/components/todos-view';

export const metadata: Metadata = { title: 'Todos · Daily Tab' };

/** The session gate stays on the server; the lists load through SWR. */
async function Gate() {
  await requirePageSession();
  return <TodosView />;
}

export default function TodosPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-8 lg:py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Todos</h1>

      <Suspense fallback={<TodosSkeleton />}>
        <Gate />
      </Suspense>
    </div>
  );
}
