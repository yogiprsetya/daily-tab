-- One-off: move daily-tab's Drizzle migration journal
--   from daily_tab.__drizzle_migrations
--   to   drizzle.daily_tab_migration   (next to drizzle.lontu_migrations)
--
-- Run once on every database that was migrated before 2026-11-08, BEFORE the
-- next `pnpm db:migrate`. Rows (and therefore applied-migration history) are
-- kept; nothing is re-run. Safe to run inside the Supabase SQL editor.
begin;

create schema if not exists drizzle;

alter table daily_tab.__drizzle_migrations rename to daily_tab_migration;
alter sequence daily_tab.__drizzle_migrations_id_seq rename to daily_tab_migration_id_seq;
alter index daily_tab.__drizzle_migrations_pkey rename to daily_tab_migration_pkey;

-- The owned sequence and the primary-key index move with the table.
alter table daily_tab.daily_tab_migration set schema drizzle;

commit;
