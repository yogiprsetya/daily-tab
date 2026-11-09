import { describe, expect, it } from 'vitest';
import { applyToggle } from './optimistic';

const at = (minute: number) => new Date(Date.UTC(2026, 10, 9, 9, minute));
const row = (id: string, minute: number) => ({
  id,
  title: id,
  url: `https://${id}.example/`,
  notes: null,
  topicId: null,
  topicName: null,
  createdAt: at(minute),
});
const ids = (rows: { id: string }[]) => rows.map((r) => r.id);

describe('applyToggle', () => {
  it('moves a read item to the top of the Read section', () => {
    const state = {
      unread: [row('a', 1), row('b', 2)],
      read: [row('c', 3)],
    };

    const next = applyToggle(state, { id: 'a', read: true });

    expect(ids(next.unread)).toEqual(['b']);
    expect(ids(next.read)).toEqual(['a', 'c']);
  });

  it('returns an unread item to its original place in the queue', () => {
    const state = {
      unread: [row('oldest', 1), row('newest', 5)],
      read: [row('middle', 3)],
    };

    const next = applyToggle(state, { id: 'middle', read: false });

    expect(ids(next.unread)).toEqual(['oldest', 'middle', 'newest']);
    expect(next.read).toEqual([]);
  });

  it.each([
    ['first', 1, ['x', 'a', 'b']],
    ['last', 9, ['a', 'b', 'x']],
  ])('can put an unread item %s', (_label, minute, expected) => {
    const state = {
      unread: [row('a', 3), row('b', 5)],
      read: [row('x', minute as number)],
    };

    expect(ids(applyToggle(state, { id: 'x', read: false }).unread)).toEqual(
      expected
    );
  });

  it('orders items with the same time by title, as the server does', () => {
    const state = {
      unread: [row('a', 1), row('c', 1)],
      read: [row('b', 1)],
    };

    expect(ids(applyToggle(state, { id: 'b', read: false }).unread)).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it('leaves the state alone for an unknown id', () => {
    const state = { unread: [row('a', 1)], read: [] };

    expect(applyToggle(state, { id: 'x', read: true })).toBe(state);
  });

  it('does not change the lists it was given', () => {
    const state = { unread: [row('a', 1)], read: [row('b', 2)] };

    applyToggle(state, { id: 'b', read: false });

    expect(ids(state.unread)).toEqual(['a']);
    expect(ids(state.read)).toEqual(['b']);
  });
});
