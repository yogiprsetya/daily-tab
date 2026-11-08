import { ListTodo } from 'lucide-react';
import type { Metadata } from 'next';
import { ModulePlaceholder } from '@/components/shell/module-placeholder';

export const metadata: Metadata = { title: 'Todos · Daily Tab' };

export default function TodosPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-8 lg:py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Todos</h1>
      <ModulePlaceholder
        icon={ListTodo}
        title="Coming soon"
        description="Todos with project filters will live here."
      />
    </div>
  );
}
