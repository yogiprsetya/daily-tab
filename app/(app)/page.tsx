import { Suspense } from 'react';
import { requirePageSession } from '@/features/auth/require-session';
import { ShortcutsSection } from '@/features/shortcuts/components/shortcuts-section';
import { ShortcutsSkeleton } from '@/features/shortcuts/components/shortcuts-skeleton';
import { PendingSection } from '@/features/todos/components/pending-section';
import { PendingSkeleton } from '@/features/todos/components/todos-skeleton';

/** The session gate stays on the server; the lists load through SWR. */
async function Gate() {
  await requirePageSession();
  return (
    <>
      <section
        aria-labelledby="shortcuts-heading"
        className="flex flex-col gap-3"
      >
        <ShortcutsSection />
      </section>

      <section
        aria-labelledby="pending-heading"
        className="flex flex-col gap-3"
      >
        <PendingSection />
      </section>
    </>
  );
}

export default function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-8 sm:px-8 lg:py-12">
      <h1 className="sr-only">Home</h1>

      <Suspense
        fallback={
          <>
            <ShortcutsSkeleton />
            <PendingSkeleton />
          </>
        }
      >
        <Gate />
      </Suspense>
    </div>
  );
}
