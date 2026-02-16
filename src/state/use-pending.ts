import { useCallback, useMemo, useState } from 'react';
import type { PendingItem, PendingType } from '~/types/pending';
import { pendingAdapter } from '~/adapters';
import { generateId } from '~/utils/id';

export function usePending() {
  const [items, setItems] = useState<PendingItem[]>(() =>
    pendingAdapter.load()
  );

  // CREATE
  const addItem = useCallback(
    (data: { title: string; type: PendingType; url?: string }) => {
      const newItem: PendingItem = {
        id: generateId(),
        title: data.title,
        type: data.type,
        url: data.url,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const updated = [...items, newItem];
      setItems(updated);
      pendingAdapter.save(updated);
      return newItem;
    },
    [items]
  );

  // READ
  const getItems = useCallback(() => items, [items]);
  const getItemById = useCallback(
    (id: string) => items.find((i) => i.id === id) || null,
    [items]
  );

  // UPDATE
  const updateItem = useCallback(
    (
      id: string,
      data: { title?: string; type?: PendingType; url?: string }
    ) => {
      const updated = items.map((i) =>
        i.id === id ? { ...i, ...data, updatedAt: Date.now() } : i
      );
      setItems(updated);
      pendingAdapter.save(updated);
      return updated.find((i) => i.id === id) || null;
    },
    [items]
  );

  // DELETE
  const deleteItem = useCallback(
    (id: string) => {
      const updated = items.filter((i) => i.id !== id);
      setItems(updated);
      pendingAdapter.save(updated);
    },
    [items]
  );

  const deleteAll = useCallback(() => {
    setItems([]);
    pendingAdapter.clear();
  }, []);

  const counts = useMemo(() => {
    return items.reduce(
      (acc, i) => {
        acc.total += 1;
        acc[i.type] = (acc[i.type] || 0) + 1;
        return acc;
      },
      { total: 0 } as Record<string, number>
    );
  }, [items]);

  return {
    items,
    counts,
    addItem,
    getItems,
    getItemById,
    updateItem,
    deleteItem,
    deleteAll,
  } as const;
}
