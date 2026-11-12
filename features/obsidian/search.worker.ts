/// <reference lib="webworker" />

import {
  createTextCache,
  searchVault,
  type NoteRef,
  type SearchHit,
} from './search';

export type SearchRequest = {
  id: number;
  query: string;
  notes: NoteRef[];
};

export type SearchReply = {
  id: number;
  hits: (SearchHit & { snippet?: string })[];
  error?: string;
};

/** Kept across requests, so a repeat search only re-reads notes that changed. */
const cache = createTextCache();

self.addEventListener('message', (event: MessageEvent<SearchRequest>) => {
  const { id, query, notes } = event.data;

  searchVault(notes, query, cache).then(
    (hits) => self.postMessage({ id, hits } satisfies SearchReply),
    (error: unknown) =>
      self.postMessage({
        id,
        hits: [],
        error: error instanceof Error ? error.message : 'search failed',
      } satisfies SearchReply)
  );
});
