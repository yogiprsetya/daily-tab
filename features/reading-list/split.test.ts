import { describe, expect, it } from 'vitest';
import { type ReadingRow, splitReading } from './optimistic';

const row = (
  id: string,
  readAt: string | null,
  createdAt = '2026-11-09T09:00:00.000Z'
): ReadingRow => ({
  id,
  title: id,
  url: `https://${id}.example/`,
  notes: null,
  topicId: null,
  topicName: null,
  readAt,
  createdAt,
});

const ids = (rows: { id: string }[]) => rows.map((item) => item.id);

describe('splitReading', () => {
  it('divides the GET rows on readAt, in the order they arrived', () => {
    const lists = splitReading([
      row('unread', null),
      row('read', '2026-11-09T10:00:00.000Z'),
    ]);

    expect(ids(lists.unread)).toEqual(['unread']);
    expect(ids(lists.read)).toEqual(['read']);
  });

  it('turns createdAt back into a Date, as applyToggle sorts by it', () => {
    const lists = splitReading([row('a', null)]);

    expect(lists.unread[0].createdAt).toBeInstanceOf(Date);
    expect(lists.unread[0].createdAt.toISOString()).toBe(
      '2026-11-09T09:00:00.000Z'
    );
  });
});
