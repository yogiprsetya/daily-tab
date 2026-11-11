'use client';

import useSWR from 'swr';
import { useFeatureEpoch, useInvalidate } from '@/lib/swr/invalidation';
import { featureKey, filterValue, queryPath } from '@/lib/swr/keys';
import type { BookmarkItem, FolderOption } from './components/types';
import type { FolderFilter } from './validation';

export type FolderRow = FolderOption & { bookmarkCount: number };

/** The GET sends the full row; the list renders only `BookmarkItem` fields. */
export type BookmarksResponse = {
  items: BookmarkItem[];
  filter: FolderFilter;
};

export type FoldersResponse = {
  items: FolderRow[];
  total: number;
  withoutFolder: number;
};
export function useBookmarks(filter: FolderFilter, query: string | undefined) {
  const epoch = useFeatureEpoch('bookmarks');
  return useSWR<BookmarksResponse>(
    featureKey(
      'bookmarks',
      epoch,
      queryPath('/api/bookmarks', {
        folder: filterValue(filter),
        q: query ?? '',
      })
    )
  );
}

export function useFolders() {
  const epoch = useFeatureEpoch('bookmark-folders');
  return useSWR<FoldersResponse>(
    featureKey('bookmark-folders', epoch, '/api/bookmark-folders')
  );
}

/** A bookmark change also moves its folder's count. */
export function useBookmarksInvalidate() {
  const invalidate = useInvalidate();
  return () => invalidate('bookmarks', 'bookmark-folders');
}
