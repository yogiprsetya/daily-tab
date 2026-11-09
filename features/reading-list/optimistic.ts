export type ReadingRow = {
  id: string;
  title: string;
  url: string;
  notes: string | null;
  topicId: string | null;
  topicName: string | null;
  createdAt: Date;
};

export type ReadingLists = { unread: ReadingRow[]; read: ReadingRow[] };

/** The server's queue order: oldest first, then by title. */
function byQueueOrder(a: ReadingRow, b: ReadingRow): number {
  return (
    a.createdAt.getTime() - b.createdAt.getTime() ||
    a.title.localeCompare(b.title)
  );
}

/** What the list shows between ticking a box and the server confirming it. */
export function applyToggle(
  state: ReadingLists,
  { id, read }: { id: string; read: boolean }
): ReadingLists {
  const from = read ? state.unread : state.read;
  const item = from.find((row) => row.id === id);
  if (!item) return state;

  const remaining = from.filter((row) => row.id !== id);
  return read
    ? { unread: remaining, read: [item, ...state.read] }
    : {
        // Sorted, so the row does not jump to the bottom and back on refresh.
        unread: [...state.unread, item].sort(byQueueOrder),
        read: remaining,
      };
}

/** Strips a database row down to what the client needs. */
export const toRow = ({
  id,
  title,
  url,
  notes,
  topicId,
  topicName,
  createdAt,
}: ReadingRow): ReadingRow => ({
  id,
  title,
  url,
  notes,
  topicId,
  topicName,
  createdAt,
});
