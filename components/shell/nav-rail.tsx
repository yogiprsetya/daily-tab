'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NAV_ITEMS, isActive } from './nav-items';
import { LogoutButton } from './logout-button';

export function NavRail({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className={cn(
        'flex w-20 shrink-0 flex-col items-center gap-1 border-r border-border py-4',
        className
      )}
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(href, pathname);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex w-16 flex-col items-center gap-1 rounded-lg py-2 text-[11px] font-medium text-muted-foreground transition-colors outline-none hover:bg-muted/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring',
              active && 'bg-muted text-foreground'
            )}
          >
            <Icon aria-hidden className="size-5" />
            {label}
          </Link>
        );
      })}
      <LogoutButton variant="rail" className="mt-auto" />
    </nav>
  );
}
