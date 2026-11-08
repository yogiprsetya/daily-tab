import { index, integer, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { dailyTab } from '@/db/schema';

export const shortcuts = dailyTab.table(
  'shortcuts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    url: text('url').notNull(),
    position: integer('position').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index('shortcuts_position_idx').on(t.position)]
);

export type Shortcut = typeof shortcuts.$inferSelect;
