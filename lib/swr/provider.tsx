'use client';

import { SWRConfig } from 'swr';
import { fetcher } from './fetcher';

const CACHE_KEY = 'daily-tab:swr-cache:v1';

function createCache() {
  const cache = new Map();

  if (typeof window === 'undefined') return cache;

  try {
    const saved = window.localStorage.getItem(CACHE_KEY);
    if (saved) {
      const entries: unknown = JSON.parse(saved);
      if (Array.isArray(entries)) {
        for (const entry of entries) {
          if (
            Array.isArray(entry) &&
            entry.length === 2 &&
            typeof entry[0] === 'string'
          ) {
            cache.set(entry[0], entry[1]);
          }
        }
      }
    }
  } catch {
    // Storage can be disabled or contain invalid data; continue with an empty cache.
  }

  const originalSet = cache.set.bind(cache);
  cache.set = (key: string, value: unknown) => {
    originalSet(key, value);
    try {
      window.localStorage.setItem(
        CACHE_KEY,
        JSON.stringify(Array.from(cache.entries()))
      );
    } catch {
      // Cache persistence is best-effort (for example, storage quota may be full).
    }
    return cache;
  };

  return cache;
}

/**
 * GET results persist across reloads: no revalidation on mount, focus or
 * reconnect. `useInvalidate()` refreshes them after a mutation.
 */
export function SwrProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        provider: createCache,
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
