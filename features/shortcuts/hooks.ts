'use client';

import useSWR from 'swr';
import { useFeatureEpoch, useInvalidate } from '@/lib/swr/invalidation';
import { featureKey } from '@/lib/swr/keys';
import type { ShortcutItem } from './components/types';

export type ShortcutsResponse = { items: ShortcutItem[] };

export function useShortcuts() {
  const epoch = useFeatureEpoch('shortcuts');
  return useSWR<ShortcutsResponse>(
    featureKey('shortcuts', epoch, '/api/shortcuts')
  );
}

export function useShortcutsInvalidate() {
  const invalidate = useInvalidate();
  return () => invalidate('shortcuts');
}
