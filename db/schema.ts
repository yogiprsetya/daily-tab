import { pgSchema } from 'drizzle-orm/pg-core';

/**
 * Every table in this app lives in the `daily_tab` schema. The local Supabase
 * instance is shared with other projects, so nothing may be created in
 * `public` or any other schema. Declare tables with `dailyTab.table(...)` in
 * `features/<module>/schema.ts`.
 */
export const dailyTab = pgSchema('daily_tab');
