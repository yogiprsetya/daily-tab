import { describe, expect, it } from 'vitest';
import { type TodoRow, splitTodos } from './optimistic';

const row = (id: string, completedAt: string | null): TodoRow => ({
  id,
  title: id,
  projectId: null,
  projectName: null,
  url: null,
  notes: null,
  completedAt,
});

const ids = (rows: { id: string }[]) => rows.map((row) => row.id);

describe('splitTodos', () => {
  it('divides the GET rows on completedAt, in the order they arrived', () => {
    const rows = [row('open', null), row('done', '2026-11-09T09:00:00.000Z')];

    const lists = splitTodos(rows);

    expect(ids(lists.pending)).toEqual(['open']);
    expect(ids(lists.completed)).toEqual(['done']);
  });

  it('keeps an empty list for the side with no rows', () => {
    expect(splitTodos([row('a', null)])).toEqual({
      pending: [expect.objectContaining({ id: 'a' })],
      completed: [],
    });
  });
});
