/**
 * Optimistic "move this row to that group" edits, kept until the refetched
 * rows agree.
 *
 * `useOptimistic` reverts as soon as its transition ends. With SWR that is
 * before the refetch lands, so a ticked row would jump back and then forward
 * again. These helpers hold the move until the server data matches it.
 */

/** The group each edited row should be shown in, keyed by row id. */
export type Overrides<K extends string> = Record<string, K>;

/**
 * How a moved row joins its target group: `start` for "most recent first", or
 * the default, which appends (the target group's own order).
 */
export type Placement<T> = 'start' | { sort: (a: T, b: T) => number };

/**
 * Moves the rows named in `targets` into their target group, keeping every
 * other row in place. A group with no `placement` appends the row.
 */
export function applyOverrides<T extends { id: string }, K extends string>(
  lists: Record<K, T[]>,
  // `NoInfer`: K comes from the lists, so a subset of targets cannot narrow it.
  targets: NoInfer<Overrides<K>>,
  placement?: NoInfer<Partial<Record<K, Placement<T>>>>
): Record<K, T[]> {
  const ids = Object.keys(targets);
  if (ids.length === 0) return lists;

  const names = Object.keys(lists) as K[];
  const groups = {} as Record<K, T[]>;
  const byId = new Map<string, T>();

  // A row with an override leaves whatever group it is in now.
  for (const name of names) {
    groups[name] = lists[name].filter((row) => {
      byId.set(row.id, row);
      return targets[row.id] === undefined;
    });
  }

  for (const id of ids) {
    const row = byId.get(id);
    if (!row) continue;

    const target = targets[id];
    if (placement?.[target] === 'start') groups[target].unshift(row);
    else groups[target].push(row);
  }

  for (const name of names) {
    const rule = placement?.[name];
    if (rule && typeof rule === 'object') groups[name].sort(rule.sort);
  }

  return groups;
}
