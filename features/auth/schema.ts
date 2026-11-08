import { bigint, boolean, index, text, timestamp } from 'drizzle-orm/pg-core';
import { dailyTab } from '@/db/schema';

/** Every login attempt, for per-IP and global rate limiting. Pruned after 24 h. */
export const loginAttempts = dailyTab.table(
  'login_attempts',
  {
    id: bigint('id', { mode: 'number' })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    ip: text('ip').notNull(),
    succeeded: boolean('succeeded').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index('login_attempts_created_at_idx').on(t.createdAt),
    index('login_attempts_ip_created_at_idx').on(t.ip, t.createdAt),
  ]
);
