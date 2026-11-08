# Implementation Plan: platform (done 2026-11-08)

Spec: [SPEC-platform.md](../SPEC-platform.md) · Map: [CAPABILITY-MAP.md](../CAPABILITY-MAP.md)
Tasks: [todo.md](todo.md)

## Overview

Build the foundation that every feature module plugs into: validated env, Drizzle + postgres.js against
Supabase with everything inside `pgSchema('daily_tab')`, a migration pipeline that cannot touch other schemas
in the shared local Supabase instance, a JSON API convention proven by `GET /api/health`, a dark-only app
shell with one route per module (nav rail ≥1024px, bottom tab bar below), and an installable PWA manifest.
Ends with a Vercel deploy talking to the Supabase cloud project.

## Architecture Decisions

- **Order: data path first, UI second.** DB + API (Tasks 1–3) carry the most unknowns (drizzle-kit behaviour
  with a custom schema, shared local instance, test database). The shell (Tasks 4–6) is low risk.
- **Migration journal inside `daily_tab`** (`migrations.schema = 'daily_tab'`) plus `schemaFilter: ['daily_tab']`,
  so drizzle-kit never diffs or writes other schemas in the shared Supabase instance.
- **Separate test database** `daily_tab_test` on the same local Postgres. Vitest sets `DATABASE_URL` to
  `TEST_DATABASE_URL` and runs migrations in global setup. Tests never touch the dev database.
- **Route group `app/(app)/`** owns the shell layout, so future non-shell routes (e.g. `/login` in `auth`)
  can live outside it without layout hacks.
- **Navigation is data**: `components/shell/nav-items.ts` is the single list both the rail and the tab bar
  render, so adding or renaming a destination is one edit.
- **Deploy is a human-gated task.** Creating the Supabase cloud project, setting Vercel env vars, and running
  the first prod migration are "ask first" in the spec.

## Task List

### Phase 1: Data foundation

- [x] Task 1: Tooling, env validation, test runner
- [x] Task 2: Drizzle connection and `daily_tab` migration pipeline
- [x] Task 3: API helpers and `GET /api/health`

### Checkpoint A: Data foundation

- [x] `npm run lint && npm run typecheck && npm test && npm run build` pass
- [x] `curl localhost:3000/api/health` → 200; unreachable DB → 503
- [x] Human review before UI work

### Phase 2: App shell

- [x] Task 4: Dark theme and root layout cleanup
- [x] Task 5: App shell with navigation and home route
- [x] Task 6: Placeholder routes for the four other modules

### Checkpoint B: App shell

- [x] No document scroll at 1440×900 and 412×915; all 5 destinations navigate
- [x] Human review of look and feel

### Phase 3: Ship

- [x] Task 7: PWA manifest and icons
- [x] Task 8: README and setup docs
- [x] Task 9: Deploy to Vercel + Supabase cloud (human-gated)

### Checkpoint C: Platform complete

- [x] Every Success Criteria box in SPEC-platform.md checked
- [x] Installed on Android from the deployed URL

## Risks and Mitigations

| Risk                                                                                             | Impact | Mitigation                                                                                                               |
| ------------------------------------------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------ |
| drizzle-kit does not emit `CREATE SCHEMA daily_tab` when the schema has no tables yet            | Med    | Verify in Task 2; if absent, add a custom migration via `drizzle-kit generate --custom`                                  |
| Migration or test accidentally touches another project's schema in the shared local instance     | High   | `schemaFilter`, journal in `daily_tab`, tests on a separate database; verify with an `information_schema` query          |
| Next 16 APIs differ from training data (`proxy.ts`, Cache Components, metadata)                  | Med    | Read the matching guide in `node_modules/next/dist/docs/` before each task; build must pass with `cacheComponents: true` |
| `usePathname` in nav or request data in a page triggers Cache Components "blocking route" errors | Low    | Nav is a small client component; placeholder pages are static; check `npm run build` output                              |
| Android install needs a secure origin                                                            | Low    | Test via the deployed URL (Task 9) or `chrome://inspect` port forwarding to localhost                                    |
| Too many pooled connections from serverless instances                                            | Low    | Transaction pooler `:6543`, `prepare: false`, `max: 5`                                                                   |

## Open Questions

Resolved 2026-11-08: home `/` = day + date, shortcuts, pending tasks; icon = generated simple mark;
Supabase connection is in `.env`, everything in `pgSchema('daily_tab')`.

- Vercel needs the cloud (pooler) connection string; the local `.env` points at `127.0.0.1:54322`.
  Confirm in Task 9.
