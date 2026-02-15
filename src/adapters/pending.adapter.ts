/**
 * Pending Adapter
 * Handles persistence of pending items to storage
 */

import type { PendingItem } from '~/types/pending';
import { storageAdapter } from './storage.adapter';

const PENDING_STORAGE_KEY = 'daily-tab-pending';

export interface PendingAdapter {
  load(): PendingItem[];
  save(items: PendingItem[]): void;
  clear(): void;
}

export const createPendingAdapter = (): PendingAdapter => {
  return {
    load(): PendingItem[] {
      return storageAdapter.getItem(PENDING_STORAGE_KEY, []);
    },

    save(items: PendingItem[]): void {
      storageAdapter.setItem(PENDING_STORAGE_KEY, items);
    },

    clear(): void {
      storageAdapter.removeItem(PENDING_STORAGE_KEY);
    },
  };
};

export const pendingAdapter = createPendingAdapter();
