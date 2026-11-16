'use client';

import { SWRConfig } from 'swr';
import { fetcher } from './fetcher';
import { createPersistentCache } from './persistent-cache';

/**
 * GET results persist across reloads: no revalidation on mount, focus or
 * reconnect. `useInvalidate()` refreshes them after a mutation.
 */
export function SwrProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        provider: (cache) =>
          typeof window === 'undefined'
            ? cache
            : createPersistentCache(window.localStorage),
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
