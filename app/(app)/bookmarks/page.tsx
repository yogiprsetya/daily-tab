import type { Metadata } from 'next';
import { Suspense } from 'react';
import { requirePageSession } from '@/features/auth/require-session';
import { BookmarksSkeleton } from '@/features/bookmarks/components/bookmarks-skeleton';
import { BookmarksView } from '@/features/bookmarks/components/bookmarks-view';

export const metadata: Metadata = { title: 'Bookmarks · Daily Tab' };

/** The session gate stays on the server; the lists load through SWR. */
async function Gate() {
  await requirePageSession();
  return <BookmarksView />;
}

export default function BookmarksPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-8 lg:py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Bookmarks</h1>
      <Suspense fallback={<BookmarksSkeleton />}>
        <Gate />
      </Suspense>
    </div>
  );
}
