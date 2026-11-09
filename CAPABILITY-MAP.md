# Capability Map: Daily Tab

Single-user personal dashboard: Chrome New Tab on desktop, installed PWA on Android.

| Module id          | Responsibility                                                                                                                                      | Depends on |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| `platform`         | Next.js shell, Drizzle → Supabase Postgres (`pgSchema('daily_tab')`), migrations, responsive 100vw × 100vh layout, installable PWA, API conventions | —          |
| `auth`             | Static email + PIN login, session, protection of pages and API routes                                                                               | platform   |
| `newtab-extension` | Chrome MV3 extension that overrides New Tab with the app                                                                                            | auth       |
| `todos`            | Todo CRUD, projects, filter by project                                                                                                              | auth       |
| `shortcuts`        | Quick-access links (CRUD, ordering)                                                                                                                 | auth       |
| `bookmarks`        | Bookmark manager inside the app (CRUD, grouping). No browser bookmark integration                                                                   | auth       |
| `reading-list`     | Things to read (add, mark as read, group by topic)                                                                                                  | auth       |
| `obsidian`         | Read-only access to the Obsidian vault synced to Google Drive by Remotely Save; usable on desktop and mobile                                        | auth       |

Build order: `platform` → `auth` → (`newtab-extension`, `shortcuts`, `todos`, `reading-list`, `bookmarks`, `obsidian`)

Feature modules are independent of each other. Suggested serial order: `newtab-extension` first (validates that
the deployed app works inside Chrome New Tab with a live session), `shortcuts` (smallest end-to-end slice), then
`todos`, `reading-list`, `bookmarks`, and `obsidian` last (Google OAuth + Drive API).

Each module has its own spec at the project root: `SPEC-<module-id>.md`.

## Fixed facts

- Hosting: Vercel Hobby (cron jobs at most once per day).
- Mobile: Android.
- UI language: English.
- Obsidian vault sync: Remotely Save → Google Drive.
