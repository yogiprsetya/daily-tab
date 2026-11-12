/**
 * A cached GET group. Invalidation bumps a feature's epoch, which retires every
 * key of that feature at once.
 */
export type Feature =
  | 'todos'
  | 'projects'
  | 'shortcuts'
  | 'bookmarks'
  | 'bookmark-folders'
  | 'reading-items'
  | 'reading-topics';

/**
 * `[feature, epoch, path]`: SWR hashes the array, and the fetcher requests the
 * path. A new epoch means a key SWR has never seen, so it fetches.
 */
export type FeatureKey = readonly [Feature, number, string];

export function featureKey(
  feature: Feature,
  epoch: number,
  path: string
): FeatureKey {
  return [feature, epoch, path];
}

/** The request path inside a key, for the fetcher. */
export function keyPath(key: FeatureKey | string): string {
  return typeof key === 'string' ? key : key[2];
}

/** `?project=<id>` style query, skipping empty values (the All case). */
export function queryPath(
  path: string,
  params: Record<string, string>
): string {
  const search = new URLSearchParams();
  for (const [name, value] of Object.entries(params)) {
    if (value) search.set(name, value);
  }
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

/**
 * The query value for a group filter: `none`, the group id, or empty for All.
 * Shared by the project, folder and topic lists, which differ only in name.
 */
export function filterValue(filter: { kind: string; id?: string }): string {
  if (filter.kind === 'none') return 'none';
  return filter.id ?? '';
}
