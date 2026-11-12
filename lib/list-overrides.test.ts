import { describe, expect, it } from 'vitest';
import { applyOverrides } from './list-overrides';

type Row = { id: string };

const row = (id: string): Row => ({ id });
const ids = (rows: Row[]) => rows.map((r) => r.id);

describe('applyOverrides', () => {
  it('moves a row into its target group and out of the old one', () => {
    const lists = { pending: [row('a'), row('b')], completed: [row('c')] };

    const next = applyOverrides(lists, { a: 'completed' });

    expect(ids(next.pending)).toEqual(['b']);
    expect(ids(next.completed)).toEqual(['c', 'a']);
  });

  it('puts a row at the top when the target says start', () => {
    const lists = { pending: [row('a')], completed: [row('c')] };

    const next = applyOverrides(
      lists,
      { a: 'completed' },
      { completed: 'start' }
    );

    expect(ids(next.completed)).toEqual(['a', 'c']);
  });

  it('re-sorts the target group when it has a sort rule', () => {
    const lists = { pending: [row('a'), row('c')], completed: [row('b')] };

    const next = applyOverrides(
      lists,
      { b: 'pending' },
      { pending: { sort: (x, y) => x.id.localeCompare(y.id) } }
    );

    expect(ids(next.pending)).toEqual(['a', 'b', 'c']);
  });

  it('returns the same object when there is nothing to move', () => {
    const lists = { pending: [row('a')], completed: [] };

    expect(applyOverrides(lists, {})).toBe(lists);
  });

  it('leaves the lists it was given untouched', () => {
    const lists = { pending: [row('a')], completed: [] };

    applyOverrides(lists, { a: 'completed' });

    expect(ids(lists.pending)).toEqual(['a']);
    expect(lists.completed).toEqual([]);
  });

  it('ignores an id that is not in any group', () => {
    const lists = { pending: [row('a')], completed: [] };

    const next = applyOverrides(lists, { ghost: 'completed' });

    expect(ids(next.pending)).toEqual(['a']);
    expect(next.completed).toEqual([]);
  });
});
