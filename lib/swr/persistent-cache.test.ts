import { describe, expect, it } from 'vitest';
import { createPersistentCache } from './persistent-cache';

function createStorage(initial?: string): Storage {
  const values = new Map<string, string>();
  if (initial !== undefined) values.set('daily-tab:swr-cache:v1', initial);

  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear(),
    key: (index) => Array.from(values.keys())[index] ?? null,
    get length() {
      return values.size;
    },
  };
}

describe('createPersistentCache', () => {
  it('restores SWR cache state with data intact', () => {
    const storage = createStorage(
      JSON.stringify([['serialized-key', { data: { items: ['cached'] } }]])
    );

    expect(createPersistentCache(storage).get('serialized-key')?.data).toEqual({
      items: ['cached'],
    });
  });

  it('persists set and delete operations', () => {
    const storage = createStorage();
    const cache = createPersistentCache(storage);
    cache.set('serialized-key', { data: { items: ['cached'] } });
    expect(createPersistentCache(storage).get('serialized-key')?.data).toEqual({
      items: ['cached'],
    });

    cache.delete('serialized-key');
    expect(
      createPersistentCache(storage).get('serialized-key')
    ).toBeUndefined();
  });

  it('starts with an empty cache when saved JSON is invalid', () => {
    expect(createPersistentCache(createStorage('{')).keys()).toEqual([]);
  });
});
