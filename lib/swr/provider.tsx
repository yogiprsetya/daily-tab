'use client';

import { SWRConfig } from 'swr';
import { useMemo } from 'react';
import { fetcher } from './fetcher';
import { createPersistentCache } from './persistent-cache';

/**
 * GET results persist across reloads: no revalidation on mount, focus or
 * reconnect. `useInvalidate()` refreshes them after a mutation.
 */
export function SwrProvider({ children }: { children: React.ReactNode }) {
  const cache = useMemo(
    () =>
      typeof window === 'undefined'
        ? undefined
        : createPersistentCache(window.localStorage),
    []
  );

  return (
    <SWRConfig
      value={{
        provider: (defaultCache) => cache ?? defaultCache,
        fetcher,
        revalidateIfStale: false,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        shouldRetryOnError: false,
        // After invalidation the key changes: keep the old rows while the new
        // ones load, instead of flashing a skeleton.
        keepPreviousData: true,
      }}
    >
      {children}
    </SWRConfig>
  );
}
