'use client';

import useSWR from 'swr';
import { useFeatureEpoch, useInvalidate } from '@/lib/swr/invalidation';
import { featureKey, filterValue, queryPath } from '@/lib/swr/keys';
import type { TodoRow } from './optimistic';
import { type ProjectFilter } from './validation';

export type ProjectRow = { id: string; name: string; pendingCount: number };

export type TodosResponse = { items: TodoRow[]; filter: ProjectFilter };
export type ProjectsResponse = {
  items: ProjectRow[];
  total: number;
  withoutProject: number;
};

export function useTodos(filter: ProjectFilter) {
  const epoch = useFeatureEpoch('todos');
  return useSWR<TodosResponse>(
    featureKey(
      'todos',
      epoch,
      queryPath('/api/todos', { project: filterValue(filter) })
    )
  );
}

export function useProjects() {
  const epoch = useFeatureEpoch('projects');
  return useSWR<ProjectsResponse>(
    featureKey('projects', epoch, '/api/projects')
  );
}

/** Todos and their project counts move together after any todo change. */
export function useTodosInvalidate() {
  const invalidate = useInvalidate();
  return () => invalidate('todos', 'projects');
}
