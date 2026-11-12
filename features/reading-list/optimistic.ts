export type ReadingItem = {
  id: string;
  title: string;
  url: string;
  notes: string | null;
  topicId: string | null;
  topicName: string | null;
  createdAt: Date;
};

/** A `GET /api/reading-items` row: the API sends `readAt`, not a flag. */
export type ReadingRow = Omit<ReadingItem, 'createdAt'> & {
  readAt: string | null;
  createdAt: string;
};

export type ReadingLists = { unread: ReadingItem[]; read: ReadingItem[] };

/** The server's queue order: oldest first, then by title. */
export function byQueueOrder(a: ReadingItem, b: ReadingItem): number {
  return (
    a.createdAt.getTime() - b.createdAt.getTime() ||
    a.title.localeCompare(b.title)
  );
}

/**
 * Splits the GET rows into the two lists. `createdAt` arrives as an ISO string
 * and becomes a Date again, because `byQueueOrder` sorts by it.
 */
export function splitReading(rows: ReadingRow[]): ReadingLists {
  const unread: ReadingItem[] = [];
  const read: ReadingItem[] = [];

  for (const row of rows) {
    const item: ReadingItem = {
      id: row.id,
      title: row.title,
      url: row.url,
      notes: row.notes,
      topicId: row.topicId,
      topicName: row.topicName,
      createdAt: new Date(row.createdAt),
    };
    (row.readAt === null ? unread : read).push(item);
  }

  return { unread, read };
}
