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
