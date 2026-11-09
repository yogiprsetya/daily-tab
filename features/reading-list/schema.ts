import { sql } from 'drizzle-orm';
import { index, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { dailyTab } from '@/db/schema';

export const readingTopics = dailyTab.table(
  'reading_topics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex('reading_topics_name_lower_idx').on(sql`lower(${t.name})`),
  ]
);

export const readingItems = dailyTab.table(
  'reading_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    url: text('url').notNull(),
    notes: text('notes'),
    // Deleting a topic keeps its items; they fall back to "No topic".
    topicId: uuid('topic_id').references(() => readingTopics.id, {
      onDelete: 'set null',
    }),
    // Null means unread.
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex('reading_items_url_idx').on(t.url),
    index('reading_items_created_at_idx').on(t.createdAt),
    index('reading_items_topic_id_idx').on(t.topicId),
  ]
);
