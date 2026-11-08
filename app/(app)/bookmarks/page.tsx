import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BookmarksSkeleton } from '@/features/bookmarks/components/bookmarks-skeleton';
import { BookmarksView } from '@/features/bookmarks/components/bookmarks-view';

export const metadata: Metadata = { title: 'Bookmarks · Daily Tab' };

export default function BookmarksPage({
  searchParams,
}: PageProps<'/bookmarks'>) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-8 lg:py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Bookmarks</h1>
      <Suspense fallback={<BookmarksSkeleton />}>
        <BookmarksView searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
