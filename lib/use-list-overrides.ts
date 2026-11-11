'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  type Overrides,
  type Placement,
  applyOverrides,
} from './list-overrides';

/**
 * Optimistic group moves for a list, held until the given rows show the move
 * themselves, or until `drop` is called (a failed request).
 *
 * Overrides whose row already sits in the named group are ignored at render
 * time rather than deleted, so no state is set in an effect and the row never
 * jumps back for a frame.
 */
export function useListOverrides<T extends { id: string }, K extends string>(
  lists: Record<K, T[]>,
  placement?: NoInfer<Partial<Record<K, Placement<T>>>>
) {
  const [targets, setTargets] = useState<Overrides<K>>({});

  const active = useMemo(() => {
    const pending: Overrides<K> = {};
    for (const [id, target] of Object.entries(targets) as [string, K][]) {
      // The server row has caught up, so stop overriding it.
      if (!lists[target].some((row) => row.id === id)) pending[id] = target;
    }
    return pending;
  }, [lists, targets]);

  const move = useCallback((id: string, target: K) => {
    setTargets((current) => ({ ...current, [id]: target }));
  }, []);

  const drop = useCallback((id: string) => {
    setTargets((current) => {
      if (!(id in current)) return current;
      const next = { ...current };
      delete next[id];
      return next;
    });
  }, []);

  return { lists: applyOverrides(lists, active, placement), move, drop };
}
