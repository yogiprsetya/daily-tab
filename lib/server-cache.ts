import 'server-only';
import { revalidateTag } from 'next/cache';

export const DATA_TAGS = {
  todos: 'data:todos',
  projects: 'data:projects',
  bookmarks: 'data:bookmarks',
  'bookmark-folders': 'data:bookmark-folders',
  'reading-items': 'data:reading-items',
  'reading-topics': 'data:reading-topics',
  shortcuts: 'data:shortcuts',
} as const;

export type DataTag = keyof typeof DATA_TAGS;

/** Route Handlers use immediate expiration so the next GET sees the mutation. */
export function invalidateData(...groups: DataTag[]) {
  for (const group of new Set(groups)) {
    revalidateTag(DATA_TAGS[group], { expire: 0 });
  }
}
