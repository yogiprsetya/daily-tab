'use client';

import { useCallback, useSyncExternalStore } from 'react';
import type { Feature } from './keys';

/**
 * A feature's cache generation, kept outside React so every mounted hook reads
 * the same value. Bumping it retires that feature's keys: the next render asks
 * SWR for a key it has never seen, so a fetch runs and fills a new entry. That
 * covers lists under other filters too, which `mutate` alone would leave stale.
 */
const epochs: Record<Feature, number> = {
  todos: 0,
  projects: 0,
  shortcuts: 0,
  bookmarks: 0,
  'bookmark-folders': 0,
  'reading-items': 0,
  'reading-topics': 0,
};

const listeners = new Map<Feature, Set<() => void>>();

/** The generation this feature's hooks should key on. */
export function useFeatureEpoch(feature: Feature): number {
  const subscribe = useCallback(
    (onChange: () => void) => {
      let set = listeners.get(feature);
      if (!set) {
        set = new Set();
        listeners.set(feature, set);
      }
      set.add(onChange);
      return () => set.delete(onChange);
    },
    [feature]
  );
  const snapshot = useCallback(() => epochs[feature], [feature]);
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

/**
 * Call after a successful POST, PATCH or DELETE. Every mounted list for these
 * features refetches under a new key; `keepPreviousData` keeps the current rows
 * on screen until the new ones arrive.
 */
export function useInvalidate() {
  return useCallback((...features: Feature[]) => {
    for (const feature of features) {
      epochs[feature] += 1;
      for (const listener of listeners.get(feature) ?? []) listener();
    }
  }, []);
}
