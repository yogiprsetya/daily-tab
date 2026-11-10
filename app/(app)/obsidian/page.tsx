import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ObsidianSkeleton } from '@/features/obsidian/components/obsidian-skeleton';
import { ObsidianView } from '@/features/obsidian/components/obsidian-view';

export const metadata: Metadata = { title: 'Obsidian · Daily Tab' };

export default function ObsidianPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-8 lg:py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Obsidian</h1>

      <Suspense fallback={<ObsidianSkeleton />}>
        <ObsidianView />
      </Suspense>
    </div>
  );
}
