import type { Cache, State } from 'swr';

const CACHE_KEY = 'daily-tab:swr-cache:v1';

export function createPersistentCache(storage: Storage): Cache {
  const cache = new Map<string, State>();

  try {
    const entries: unknown = JSON.parse(storage.getItem(CACHE_KEY) ?? '[]');
    if (Array.isArray(entries)) {
      for (const entry of entries) {
        if (
          !Array.isArray(entry) ||
          entry.length !== 2 ||
          typeof entry[0] !== 'string'
        ) {
          continue;
        }
        cache.set(entry[0], entry[1]);
      }
    }
  } catch {
    // Start empty when storage is unavailable or invalid.
  }

  const persist = () => {
    try {
      const entries = Array.from(cache, ([key, state]) => {
        const { error: _error, ...persistedState } = state;
        return [key, persistedState];
      });
      storage.setItem(CACHE_KEY, JSON.stringify(entries));
    } catch {
      // Persistence is best-effort (for example, storage quota may be full).
    }
  };

  return {
    keys: () => cache.keys(),
    get: (key) => cache.get(key),
    set: (key, value) => {
      cache.set(key, value);
      persist();
    },
    delete: (key) => {
      cache.delete(key);
      persist();
    },
  };
}
