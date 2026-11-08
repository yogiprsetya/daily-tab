'use client';

import { LogOut } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

/** Stacked icon + label, matching the desktop nav rail. */
export function LogoutButton({ className }: { className?: string }) {
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
        'flex w-16 flex-col items-center gap-1 rounded-lg py-2 text-[11px] font-medium text-muted-foreground transition-colors outline-none hover:bg-muted/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50',
        className
      )}
    >
      <LogOut aria-hidden className="size-5" />
      {pending ? 'Signing out…' : 'Log out'}
    </button>
  );
}
