# Capability Map: Daily Tab

Single-user personal dashboard: Chrome New Tab on desktop, installed PWA on Android.

| Module id          | Responsibility                                                                                                                                      | Depends on         |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| `platform`         | Next.js shell, Drizzle → Supabase Postgres (`pgSchema('daily_tab')`), migrations, responsive 100vw × 100vh layout, installable PWA, API conventions | —                  |
| `auth`             | Static email + PIN login, session, protection of pages and API routes                                                                               | platform           |
| `newtab-extension` | Chrome MV3 extension that overrides New Tab with the app and saves the current page to the reading list                                             | auth, reading-list |
| `todos`            | Todo CRUD, projects, filter by project                                                                                                              | auth               |
| `shortcuts`        | Quick-access links (CRUD, ordering)                                                                                                                 | auth               |
| `bookmarks`        | Bookmark manager inside the app (CRUD, grouping). No browser bookmark integration                                                                   | auth               |
| `reading-list`     | Things to read (add, mark as read, group by topic)                                                                                                  | auth               |
| `obsidian`         | Read-only view of the Obsidian vault: the browser reads the folder the owner picks, then browse, read, search                                       | auth               |

Build order: `platform` → `auth` → (`newtab-extension`, `shortcuts`, `todos`, `reading-list`, `bookmarks`, `obsidian`)

Feature modules are independent of each other, except that the `newtab-extension` save button uses the `reading-list`
API. Suggested serial order: `newtab-extension` first (validates that
the deployed app works inside Chrome New Tab with a live session), `shortcuts` (smallest end-to-end slice), then
`todos`, `reading-list`, `bookmarks`, and `obsidian` last.

Each module has its own spec at the project root: `SPEC-<module-id>.md`.

## Fixed facts

- Hosting: Vercel Hobby (cron jobs at most once per day).
- Mobile: Android.
- UI language: English.
- Obsidian vault: the browser reads the folder the owner picks with the File System Access API, never a server and
  never Google Drive. The vault itself is still synced between devices by Remotely Save, outside this app. Desktop
  Chrome or Edge only; the API does not exist on Android or iOS.
