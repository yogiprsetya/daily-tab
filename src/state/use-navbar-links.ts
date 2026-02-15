import { useCallback, useState } from 'react';
import type { StoredShortcut } from '~/types/shortcuts';
import { settingsAdapter } from '~/adapters';

export function useNavbarLinks() {
  const [links, setLinks] = useState<StoredShortcut[]>(() =>
    settingsAdapter.loadNavbarLinks()
  );

  const refresh = useCallback(() => {
    setLinks(settingsAdapter.loadNavbarLinks());
  }, []);

  const persist = useCallback((next: StoredShortcut[]) => {
    setLinks(next);
    settingsAdapter.saveNavbarLinks(next);
  }, []);

  const addLink = useCallback(
    (title: string, url: string) => {
      const trimmedTitle = title.trim();
      const trimmedUrl = url.trim();
      if (!trimmedTitle || !trimmedUrl) return false;
      const id = Date.now().toString();
      const item: StoredShortcut = {
        id,
        title: trimmedTitle,
        url: trimmedUrl,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const next = [item, ...settingsAdapter.loadNavbarLinks()];
      persist(next.slice(0, 5));
      return true;
    },
    [persist]
  );

  const removeLink = useCallback(
    (id: string) => {
      const next = links.filter((l) => l.id !== id);
      persist(next);
    },
    [links, persist]
  );

  const updateLink = useCallback(
    (id: string, title: string, url: string) => {
      const trimmedTitle = title.trim();
      const trimmedUrl = url.trim();
      if (!trimmedTitle || !trimmedUrl) return false;

      const exists = links.some((l) => l.id === id);
      if (!exists) return false;

      const next = links.map((l) =>
        l.id === id
          ? {
              ...l,
              title: trimmedTitle,
              url: trimmedUrl,
              updatedAt: Date.now(),
            }
          : l
      );
      persist(next);
      return true;
    },
    [links, persist]
  );

  return {
    links,
    addLink,
    removeLink,
    updateLink,
    refresh,
    maxReached: links.length >= 5,
  } as const;
}
