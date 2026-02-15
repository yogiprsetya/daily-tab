/**
 * Storage Adapter
 * Handles all localStorage operations for the application
 * Provides a unified interface for reading/writing data
 */

export interface StorageAdapter {
  getItem<T>(key: string, fallback: T): T;
  setItem<T>(key: string, value: T): void;
  removeItem(key: string): void;
  clear(): void;
}

const createStorageAdapter = (): StorageAdapter => {
  return {
    getItem<T>(key: string, fallback: T): T {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw) as T;
      } catch {
        return fallback;
      }
    },

    setItem<T>(key: string, value: T): void {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        console.error(`Failed to save ${key} to storage`);
      }
    },

    removeItem(key: string): void {
      try {
        localStorage.removeItem(key);
      } catch {
        console.error(`Failed to remove ${key} from storage`);
      }
    },

    clear(): void {
      try {
        localStorage.clear();
      } catch {
        console.error('Failed to clear storage');
      }
    },
  };
};

export const storageAdapter = createStorageAdapter();
