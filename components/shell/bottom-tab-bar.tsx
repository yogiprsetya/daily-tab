'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NAV_ITEMS, isActive } from './nav-items';

export function BottomTabBar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className={cn(
        'shrink-0 border-t border-border bg-background pb-[env(safe-area-inset-bottom)]',
        className
      )}
    >
      <ul className="grid grid-cols-5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href, pathname);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors outline-none focus-visible:bg-muted focus-visible:text-foreground',
                  active && 'text-foreground'
                )}
              >
                <Icon
                  aria-hidden
                  className={cn('size-5', active && 'stroke-[2.25]')}
                />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
