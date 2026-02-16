import { useCallback, useState } from 'react';
import { settingsAdapter } from '~/adapters';
import { showAlert } from '~/components/ui/alert-provider';
import type { StoredShortcut } from '~/types/shortcuts';

export function useShortcuts() {
  const [shortcuts, setShortcuts] = useState<StoredShortcut[]>(() =>
    settingsAdapter.loadShortcuts()
  );

  const refresh = useCallback(() => {
    setShortcuts(settingsAdapter.loadShortcuts());
  }, []);

  const persist = useCallback((next: StoredShortcut[]) => {
    setShortcuts(next);
    settingsAdapter.saveShortcuts(next);
  }, []);

  // Count distinct groups INCLUDING empty (Ungrouped)
  const countGroups = useCallback((arr: StoredShortcut[]) => {
    const set = new Set(arr.map((s) => (s.group ?? '').trim()));
    return set.size;
  }, []);

  // Pick the latest existing group's name (prefer non-empty; fallback to empty)
  const latestGroup = useCallback((arr: StoredShortcut[]) => {
    const groups = new Map<string, number>();
    for (const s of arr) {
      const key = (s.group ?? '').trim();
      const ts = s.updatedAt ?? s.createdAt ?? 0;
      const prev = groups.get(key) ?? 0;
      if (ts > prev) groups.set(key, ts);
    }
    const nonEmpty = Array.from(groups.entries()).filter(([g]) => g.length > 0);
    const pool = nonEmpty.length > 0 ? nonEmpty : Array.from(groups.entries());
    if (pool.length === 0) return '';
    pool.sort((a, b) => b[1] - a[1]);
    return pool[0][0];
  }, []);

  const addShortcut = useCallback(
    (title: string, url: string, group?: string) => {
      const trimmedTitle = title.trim();
      const trimmedUrl = url.trim();
      const trimmedGroup = (group ?? '').trim();
      if (!trimmedTitle || !trimmedUrl) return null;

      const currentCount = countGroups(shortcuts);
      const effectiveGroup =
        currentCount >= 3 && trimmedGroup.length === 0
          ? latestGroup(shortcuts)
          : trimmedGroup;

      const now = Date.now();
      const item: StoredShortcut = {
        id: now.toString(),
        title: trimmedTitle,
        url: trimmedUrl,
        group: (effectiveGroup || '').trim() || undefined,
        createdAt: now,
        updatedAt: now,
      };
      const proposed = [item, ...shortcuts];
      if (countGroups(proposed) > 3) {
        showAlert(
          'Maximum 3 groups allowed. Please use an existing group or leave it empty.',
          'Limit reached'
        );
        return null;
      }
      persist(proposed);
      return item;
    },
    [shortcuts, persist, countGroups, latestGroup]
  );

  const updateShortcut = useCallback(
    (
      id: string,
      data: { title: string; url: string; group?: string | null }
    ) => {
      const trimmedTitle = data.title.trim();
      const trimmedUrl = data.url.trim();
      const trimmedGroup = (data.group ?? '').trim();
      if (!trimmedTitle || !trimmedUrl) return null;

      const currentCount = countGroups(shortcuts);
      const effectiveGroup =
        currentCount >= 3 && trimmedGroup.length === 0
          ? latestGroup(shortcuts)
          : trimmedGroup;

      const proposed = shortcuts.map((s) =>
        s.id === id
          ? {
              ...s,
              title: trimmedTitle,
              url: trimmedUrl,
              group: (effectiveGroup || '').trim() || undefined,
              updatedAt: Date.now(),
            }
          : s
      );
      if (countGroups(proposed) > 3) {
        showAlert(
          'Maximum 3 groups allowed. Please use an existing group or leave it empty.',
          'Limit reached'
        );
        return null;
      }
      persist(proposed);
      return proposed.find((s) => s.id === id) ?? null;
    },
    [shortcuts, persist, countGroups, latestGroup]
  );

  const deleteShortcut = useCallback(
    (id: string) => {
      const next = shortcuts.filter((s) => s.id !== id);
      persist(next);
    },
    [shortcuts, persist]
  );

  return {
    shortcuts,
    refresh,
    addShortcut,
    updateShortcut,
    deleteShortcut,
  } as const;
}
