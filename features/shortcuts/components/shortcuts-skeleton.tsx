import { cn } from '@/lib/utils';
import { GRID } from './grid-styles';

// One row at every breakpoint: 4 tiles, 6 from sm, 8 from lg.
const VISIBILITY = [
  '',
  '',
  '',
  '',
  'hidden sm:block',
  'hidden sm:block',
  'hidden lg:block',
  'hidden lg:block',
];

export function ShortcutsSkeleton() {
  return (
    <>
      <div className="flex min-h-11 items-center">
        <h2
          id="shortcuts-heading"
          className="text-sm font-medium text-muted-foreground"
        >
          Shortcuts
        </h2>
      </div>
      <div aria-hidden className={GRID}>
        {VISIBILITY.map((visibility, index) => (
          <div key={index} className={cn('min-h-22 p-2', visibility)}>
            <div className="mx-auto size-11 rounded-lg bg-muted motion-safe:animate-pulse" />
          </div>
        ))}
      </div>
    </>
  );
}
