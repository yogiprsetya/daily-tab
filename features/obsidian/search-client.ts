'use client';

import type { SearchReply, SearchRequest } from './search.worker';
import {
  createTextCache,
  searchVault,
  type NoteRef,
  type SearchHit,
} from './search';

export type Result = SearchHit & { snippet?: string };

/** A worker's `postMessage` can throw when it is being torn down; then fall back. */
function createWorker(): Worker | null {
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
export function createSearchClient() {
  let worker: Worker | null = createWorker();
  const cache = createTextCache();
  const pending = new Map<number, (hits: Result[]) => void>();
  let nextId = 1;

  if (worker) {
    worker.addEventListener('message', (event: MessageEvent<SearchReply>) => {
      const resolve = pending.get(event.data.id);
      if (!resolve) return;
      pending.delete(event.data.id);
      resolve(event.data.hits);
    });
  }

  function inline(query: string, notes: NoteRef[]): Promise<Result[]> {
    return searchVault(notes, query, cache);
  }

  return {
    async search(query: string, notes: NoteRef[]): Promise<Result[]> {
      if (!worker) return inline(query, notes);

      const id = nextId++;
      return new Promise<Result[]>((resolve) => {
        pending.set(id, resolve);
        try {
          worker!.postMessage({ id, query, notes } satisfies SearchRequest);
        } catch {
          // The worker was terminated between the check and the send.
          pending.delete(id);
          worker = null;
          void inline(query, notes).then(resolve);
        }
      });
    },

    dispose() {
      worker?.terminate();
      worker = null;
      pending.clear();
    },
  };
}
