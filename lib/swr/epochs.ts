import type { Feature } from './keys';

const EPOCHS_KEY = 'daily-tab:swr-epochs:v1';

export type EpochStorage = Pick<Storage, 'getItem' | 'setItem'>;
export type Epochs = Record<Feature, number>;

const initialEpochs = (): Epochs => ({
  todos: 0,
  projects: 0,
  shortcuts: 0,
  bookmarks: 0,
  'bookmark-folders': 0,
  'reading-items': 0,
  'reading-topics': 0,
});

export function createEpochStore(storage?: EpochStorage) {
  const epochs = initialEpochs();

  try {
    const saved: unknown = JSON.parse(storage?.getItem(EPOCHS_KEY) ?? 'null');
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
      for (const feature of Object.keys(epochs) as Feature[]) {
        const value = (saved as Record<string, unknown>)[feature];
        if (Number.isSafeInteger(value) && (value as number) >= 0) {
          epochs[feature] = value as number;
        }
      }
    }
  } catch {
    // Start at generation zero when storage is unavailable or invalid.
  }

  return {
    get: (feature: Feature) => epochs[feature],
    bump: (feature: Feature) => {
      epochs[feature] += 1;
      try {
        storage?.setItem(EPOCHS_KEY, JSON.stringify(epochs));
      } catch {
        // Persistence is best-effort; mounted hooks still receive the bump.
      }
      return epochs[feature];
    },
  };
}
