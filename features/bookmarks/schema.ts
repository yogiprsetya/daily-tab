import { sql } from 'drizzle-orm';
import { index, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { dailyTab } from '@/db/schema';

export const bookmarkFolders = dailyTab.table(
  'bookmark_folders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex('bookmark_folders_name_lower_idx').on(sql`lower(${t.name})`),
  ]
);

export const bookmarks = dailyTab.table(
  'bookmarks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    url: text('url').notNull(),
    notes: text('notes'),
    // Deleting a folder keeps its bookmarks; they fall back to "No folder".
    folderId: uuid('folder_id').references(() => bookmarkFolders.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex('bookmarks_url_idx').on(t.url),
    index('bookmarks_created_at_idx').on(t.createdAt),
    index('bookmarks_folder_id_idx').on(t.folderId),
  ]
);
