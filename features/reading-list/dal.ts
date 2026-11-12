import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import {
  and,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  isNotNull,
  isNull,
  sql,
} from 'drizzle-orm';
import { db } from '@/db';
import {
  FOREIGN_KEY_VIOLATION,
  UNIQUE_VIOLATION,
  translatePgError,
} from '@/db/pg-errors';
import { readingItems, readingTopics } from './schema';
import type { TopicFilter } from './validation';

export class DuplicateReadingItemError extends Error {}
export class UnknownTopicError extends Error {}
export class DuplicateTopicError extends Error {}

const ITEM_ERRORS = {
  [UNIQUE_VIOLATION]: DuplicateReadingItemError,
  [FOREIGN_KEY_VIOLATION]: UnknownTopicError,
};
const TOPIC_ERRORS = { [UNIQUE_VIOLATION]: DuplicateTopicError };

type ItemFields = {
  title?: string;
  url?: string;
  notes?: string | null;
  topicId?: string | null;
};

function matchesFilter(filter: TopicFilter) {
  if (filter.kind === 'none') return isNull(readingItems.topicId);
  if (filter.kind === 'topic') return eq(readingItems.topicId, filter.id);
  return undefined;
}

function selectItems() {
  return db
    .select({
      ...getTableColumns(readingItems),
      topicName: readingTopics.name,
    })
    .from(readingItems)
    .leftJoin(readingTopics, eq(readingItems.topicId, readingTopics.id));
}

export async function listUnread(filter: TopicFilter) {
  'use cache';
  cacheLife('max');
  cacheTag('data:reading-items', 'data:reading-topics');
  return await selectItems()
    .where(and(isNull(readingItems.readAt), matchesFilter(filter)))
    .orderBy(asc(readingItems.createdAt), asc(readingItems.title));
}

export async function listRead(filter: TopicFilter) {
  'use cache';
  cacheLife('max');
  cacheTag('data:reading-items', 'data:reading-topics');
  return await selectItems()
    .where(and(isNotNull(readingItems.readAt), matchesFilter(filter)))
    .orderBy(desc(readingItems.readAt), asc(readingItems.title));
}

export async function countUnread(): Promise<number> {
  'use cache';
  cacheLife('max');
  cacheTag('data:reading-items');
  const [row] = await db
    .select({ total: count() })
    .from(readingItems)
    .where(isNull(readingItems.readAt));
  return row.total;
}

export async function unreadWithoutTopic(): Promise<number> {
  'use cache';
  cacheLife('max');
  cacheTag('data:reading-items');
  const [row] = await db
    .select({ total: count() })
    .from(readingItems)
    .where(and(isNull(readingItems.readAt), isNull(readingItems.topicId)));
  return row.total;
}

/** A filter on a topic that no longer exists behaves as All. */
export async function resolveTopicFilter(
  filter: TopicFilter
): Promise<TopicFilter> {
  'use cache';
  cacheLife('max');
  cacheTag('data:reading-topics');
  if (filter.kind !== 'topic') return filter;
  const [row] = await db
    .select({ id: readingTopics.id })
    .from(readingTopics)
    .where(eq(readingTopics.id, filter.id));
  return row ? filter : { kind: 'all' };
}

export function createReadingItem(
  input: ItemFields & { title: string; url: string }
) {
  return translatePgError(ITEM_ERRORS, async () => {
    const [row] = await db.insert(readingItems).values(input).returning();
    return row;
  });
}

/** `coalesce` so that marking a read item as read keeps its original time. */
function readAtFor(read: boolean | undefined) {
  if (read === undefined) return {};
  return {
    readAt: read ? sql`coalesce(${readingItems.readAt}, now())` : null,
  };
}

export function updateReadingItem(
  id: string,
  { read, ...fields }: ItemFields & { read?: boolean }
) {
  return translatePgError(ITEM_ERRORS, async () => {
    const [row] = await db
      .update(readingItems)
      .set({ ...fields, ...readAtFor(read), updatedAt: new Date() })
      .where(eq(readingItems.id, id))
      .returning();
    return row ?? null;
  });
}

export async function removeReadingItem(id: string): Promise<boolean> {
  const rows = await db
    .delete(readingItems)
    .where(eq(readingItems.id, id))
    .returning({ id: readingItems.id });
  return rows.length > 0;
}

export async function listTopics() {
  'use cache';
  cacheLife('max');
  cacheTag('data:reading-topics', 'data:reading-items');
  return await db
    .select({
      ...getTableColumns(readingTopics),
      unreadCount: count(readingItems.id),
    })
    .from(readingTopics)
    .leftJoin(
      readingItems,
      and(
        eq(readingItems.topicId, readingTopics.id),
        isNull(readingItems.readAt)
      )
    )
    .groupBy(readingTopics.id)
    .orderBy(sql`lower(${readingTopics.name})`);
}

export function createTopic(name: string) {
  return translatePgError(TOPIC_ERRORS, async () => {
    const [row] = await db.insert(readingTopics).values({ name }).returning();
    return row;
  });
}

export function updateTopic(id: string, name: string) {
  return translatePgError(TOPIC_ERRORS, async () => {
    const [row] = await db
      .update(readingTopics)
      .set({ name })
      .where(eq(readingTopics.id, id))
      .returning();
    return row ?? null;
  });
}

/** Its items stay and fall back to No topic (`ON DELETE SET NULL`). */
export async function removeTopic(id: string): Promise<boolean> {
  const rows = await db
    .delete(readingTopics)
    .where(eq(readingTopics.id, id))
    .returning({ id: readingTopics.id });
  return rows.length > 0;
}
