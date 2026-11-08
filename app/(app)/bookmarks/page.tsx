import { Bookmark } from 'lucide-react';
import type { Metadata } from 'next';
import { ModulePlaceholder } from '@/components/shell/module-placeholder';

export const metadata: Metadata = { title: 'Bookmarks · Daily Tab' };

export default function BookmarksPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-8 lg:py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Bookmarks</h1>
      <ModulePlaceholder
        icon={Bookmark}
        title="Coming soon"
        description="Your bookmark manager will live here."
      />
    </div>
  );
}
