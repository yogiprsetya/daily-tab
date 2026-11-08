'use client';

import { LogOut } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * `rail`: stacked icon + label matching the desktop nav rail.
 * `inline`: compact row for the mobile Home header.
 */
export function LogoutButton({
  variant,
  className,
}: {
  variant: 'rail' | 'inline';
  className?: string;
}) {
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      // Full navigation also drops the client router cache, so Back cannot
      // show protected pages from memory.
      window.location.replace('/login');
    }
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={pending}
      className={cn(
        'flex items-center text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50',
        variant === 'rail'
          ? 'w-16 flex-col gap-1 rounded-lg py-2 text-[11px] font-medium hover:bg-muted/60'
          : 'min-h-11 gap-2 rounded-lg px-3 text-sm',
        className
      )}
    >
      <LogOut aria-hidden className="size-5" />
      {pending ? 'Signing out…' : 'Log out'}
    </button>
  );
}
