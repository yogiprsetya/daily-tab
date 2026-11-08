import { Suspense } from 'react';
import { Today } from '@/components/home/today';
import { LogoutButton } from '@/components/shell/logout-button';
import { ShortcutsSection } from '@/features/shortcuts/components/shortcuts-section';
import { ShortcutsSkeleton } from '@/features/shortcuts/components/shortcuts-skeleton';
import { PendingSection } from '@/features/todos/components/pending-section';
import { PendingSkeleton } from '@/features/todos/components/todos-skeleton';

export default function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-8 sm:px-8 lg:py-12">
      <header className="flex items-start justify-between gap-4">
        <h1 className="sr-only">Today</h1>
        <div>
          <Today />
        </div>
        <LogoutButton variant="inline" className="-mr-3 lg:hidden" />
      </header>

      <section
        aria-labelledby="shortcuts-heading"
        className="flex flex-col gap-3"
      >
        <Suspense fallback={<ShortcutsSkeleton />}>
          <ShortcutsSection />
        </Suspense>
      </section>

      <section
        aria-labelledby="pending-heading"
        className="flex flex-col gap-3"
      >
        <Suspense fallback={<PendingSkeleton />}>
          <PendingSection />
        </Suspense>
      </section>
    </div>
  );
}
