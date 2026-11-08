import { NotebookText } from 'lucide-react';
import type { Metadata } from 'next';
import { ModulePlaceholder } from '@/components/shell/module-placeholder';

export const metadata: Metadata = { title: 'Obsidian · Daily Tab' };

export default function ObsidianPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-8 lg:py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Obsidian</h1>
      <ModulePlaceholder
        icon={NotebookText}
        title="Coming soon"
        description="A read-only view of your Obsidian vault will live here."
      />
    </div>
  );
}
