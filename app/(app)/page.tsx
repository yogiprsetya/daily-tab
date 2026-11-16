import { Suspense } from 'react';
import { requirePageSession } from '@/features/auth/require-session';
import { ShortcutsSection } from '@/features/shortcuts/components/shortcuts-section';
import { ShortcutsSkeleton } from '@/features/shortcuts/components/shortcuts-skeleton';
import { PendingSection } from '@/features/todos/components/pending-section';
import { PendingSkeleton } from '@/features/todos/components/todos-skeleton';
import { HomeCollections } from '@/features/home-collections';

/** The session gate stays on the server; the lists load through SWR. */
async function Gate() {
  await requirePageSession();

  return (
    <div className="flex gap-6">
      <section
        aria-labelledby="shortcuts-heading"
        className="flex w-full flex-col gap-3"
      >
        <ShortcutsSection />
        <HomeCollections />
      </section>

      <section
        aria-labelledby="pending-heading"
        className="flex w-5/12 flex-col gap-3"
      >
        <PendingSection />
      </section>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-7xl gap-5 px-4 py-5 sm:px-7 sm:py-7 xl:gap-6">
      <header className="flex min-h-14 items-center justify-between border-b border-border pb-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground">DAILY TAB</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">
            Your space
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">A little room to focus</p>
      </header>

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
