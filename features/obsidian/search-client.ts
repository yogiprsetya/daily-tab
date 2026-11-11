'use client';

import type { SearchReply, SearchRequest } from './search.worker';
import {
  createTextCache,
  searchVault,
  type NoteRef,
  type SearchHit,
} from './search';

export type Result = SearchHit & { snippet?: string };

/** A search that runs off the main thread, or inline when no worker is available. */
export type SearchClient = {
  search(query: string, notes: NoteRef[]): Promise<Result[]>;
  dispose(): void;
};

function startWorker(): Worker | null {
  // Nothing here runs on the server, but the module is bundled for SSR too.
  if (typeof window === 'undefined' || typeof Worker === 'undefined')
    return null;

  try {
    const worker = new Worker(new URL('./search.worker.ts', import.meta.url), {
      type: 'module',
    });
    // A worker reports a bad URL or a syntax error asynchronously.
    worker.addEventListener('error', () => worker.terminate());
    return worker;
  } catch {
    return null;
  }
}

/**
 * Runs a search off the main thread so a large vault does not freeze typing.
 * Falls back to the same functions inline when workers are unavailable, which
 * keeps the result identical — only the responsiveness differs.
 */
export function createSearchClient(): SearchClient {
  const worker = startWorker();
  const cache = createTextCache();
  const pending = new Map<number, (hits: Result[]) => void>();
  let nextId = 1;

  worker?.addEventListener('message', (event: MessageEvent<SearchReply>) => {
    const resolve = pending.get(event.data.id);
    if (!resolve) return;
    pending.delete(event.data.id);
    resolve(event.data.hits);
  });

  const inline = (query: string, notes: NoteRef[]): Promise<Result[]> =>
    searchVault(notes, query, cache);

  return {
    async search(query, notes) {
      if (!worker) return inline(query, notes);

      const id = nextId++;
      return new Promise<Result[]>((resolve) => {
        pending.set(id, resolve);
        // `postMessage` throws only when the worker is already gone, so retrying inline is the fix.
        try {
          worker.postMessage({ id, query, notes } satisfies SearchRequest);
        } catch {
          pending.delete(id);
          void inline(query, notes).then(resolve);
        }
      });
    },

    dispose() {
      worker?.terminate();
      pending.clear();
    },
  };
}
