import { describe, expect, it } from 'vitest';
import { applyToggle } from './optimistic';

const todo = (id: string, projectName: string | null = null) => ({
  id,
  title: id,
  projectId: null,
  projectName,
  url: null,
  notes: null,
});

describe('applyToggle', () => {
  it('moves a completed todo to the top of completed', () => {
    const state = { pending: [todo('a'), todo('b')], completed: [todo('c')] };

    const next = applyToggle(state, { id: 'a', completed: true });

    expect(next.pending.map((t) => t.id)).toEqual(['b']);
    expect(next.completed.map((t) => t.id)).toEqual(['a', 'c']);
  });

  it('moves a reopened todo to the end of pending', () => {
    const state = { pending: [todo('a')], completed: [todo('c')] };

    const next = applyToggle(state, { id: 'c', completed: false });

    expect(next.pending.map((t) => t.id)).toEqual(['a', 'c']);
    expect(next.completed).toEqual([]);
  });

  it('leaves the state alone for an unknown id', () => {
    const state = { pending: [todo('a')], completed: [] };

    expect(applyToggle(state, { id: 'x', completed: true })).toBe(state);
  });
});
