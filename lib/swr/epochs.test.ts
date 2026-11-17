import { describe, expect, it } from 'vitest';
import { createEpochStore, type EpochStorage } from './epochs';

function createStorage(): EpochStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

describe('createEpochStore', () => {
  it('preserves the advanced generation across a reload', () => {
    const storage = createStorage();
    const firstLoad = createEpochStore(storage);

    firstLoad.bump('todos');

    const afterReload = createEpochStore(storage);
    expect(afterReload.get('todos')).toBe(1);
    expect(afterReload.get('projects')).toBe(0);
  });

  it('ignores invalid persisted values', () => {
    const storage = createStorage();
    storage.setItem('daily-tab:swr-epochs:v1', '{');

    expect(createEpochStore(storage).get('todos')).toBe(0);
  });
});
