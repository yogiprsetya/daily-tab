import { sql } from 'drizzle-orm';
import { index, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { dailyTab } from '@/db/schema';

export const projects = dailyTab.table(
  'projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex('projects_name_lower_idx').on(sql`lower(${t.name})`)]
);

export const todos = dailyTab.table(
  'todos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    // Deleting a project keeps its todos; they fall back to "No project".
    projectId: uuid('project_id').references(() => projects.id, {
      onDelete: 'set null',
    }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index('todos_completed_at_created_at_idx').on(t.completedAt, t.createdAt),
    index('todos_project_id_idx').on(t.projectId),
  ]
);

export type Project = typeof projects.$inferSelect;
export type Todo = typeof todos.$inferSelect;
