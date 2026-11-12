'use client';

import useSWR from 'swr';
import { useFeatureEpoch, useInvalidate } from '@/lib/swr/invalidation';
import { featureKey, filterValue, queryPath } from '@/lib/swr/keys';
import type { ReadingRow } from './optimistic';
import type { TopicFilter } from './validation';

export type TopicRow = { id: string; name: string; unreadCount: number };

export type ReadingItemsResponse = {
  items: ReadingRow[];
  filter: TopicFilter;
};

export type TopicsResponse = {
  items: TopicRow[];
  total: number;
  withoutTopic: number;
};

export function useReadingItems(filter: TopicFilter) {
  const epoch = useFeatureEpoch('reading-items');
  return useSWR<ReadingItemsResponse>(
    featureKey(
      'reading-items',
      epoch,
      queryPath('/api/reading-items', { topic: filterValue(filter) })
    )
  );
}

export function useTopics() {
  const epoch = useFeatureEpoch('reading-topics');
  return useSWR<TopicsResponse>(
    featureKey('reading-topics', epoch, '/api/reading-topics')
  );
}

/** An item change also moves its topic's unread count. */
export function useReadingInvalidate() {
  const invalidate = useInvalidate();
  return () => invalidate('reading-items', 'reading-topics');
}
