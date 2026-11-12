import type { Metadata } from 'next';
import { Suspense } from 'react';
import { requirePageSession } from '@/features/auth/require-session';
import { ReadingSkeleton } from '@/features/reading-list/components/reading-skeleton';
import { ReadingView } from '@/features/reading-list/components/reading-view';

export const metadata: Metadata = { title: 'Reading list · Daily Tab' };

/** The session gate stays on the server; the lists load through SWR. */
async function Gate() {
  await requirePageSession();
  return <ReadingView />;
}

export default function ReadingListPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-8 lg:py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Reading list</h1>

      <Suspense fallback={<ReadingSkeleton />}>
        <Gate />
      </Suspense>
    </div>
  );
}
