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
      <section
        aria-label="Saved for later"
        className="flex flex-col gap-5 xl:row-span-2"
      >
        <HomeCollections />
      </section>
    </>
  );
}

export default function HomePage() {
  return (
    <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-5 sm:px-7 sm:py-7 xl:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)] xl:gap-6">
      <header className="col-span-full flex min-h-14 items-center justify-between border-b border-border pb-4">
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
