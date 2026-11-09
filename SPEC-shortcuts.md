# Spec: shortcuts

Status: **Approved 2026-11-08**
Module id: `shortcuts` (see [CAPABILITY-MAP.md](CAPABILITY-MAP.md)) · Depends on: `auth`

## Objective

Give the owner one-tap access to the sites they open every day, right on Home (`/`), which is what the
app shows first on desktop and Android. There is no separate `/shortcuts` route.

### Acceptance criteria

1. Display
   - Home's "Shortcuts" section shows a responsive grid of tiles (icon + title, title truncated to one
     line) in the owner's chosen order.
   - A tile is a normal link: click opens in the same tab; Ctrl/Cmd+click and middle-click open a new tab.
   - Icon comes from `https://icons.duckduckgo.com/ip3/<hostname>.ico`. While it fails or is missing, the
     tile shows the title's first letter. Only the hostname leaves the app (`referrerPolicy="no-referrer"`).
   - Empty state offers "Add shortcut".
2. Manage
   - An "Edit" toggle in the section header switches the grid into edit mode. In edit mode the grid becomes
     a list of rows (three 44px buttons do not fit a phone-width tile). Rows are not links; each shows Move
     up, Move down and Edit buttons, and an "Add shortcut" row is shown.
   - Add and Edit use a dialog with Title and URL. Edit also offers Delete, which needs a second press to
     confirm.
   - All controls are keyboard reachable, labelled, and at least 44px tall on touch screens.
3. URL rules (shared by form and API)
   - Input is trimmed; without a scheme, `https://` is prepended (`github.com` → `https://github.com/`).
   - Only `http:` and `https:` are accepted; URLs with embedded credentials are rejected.
   - Title 1–80 characters after trim; URL at most 2048 characters.
4. Ordering
   - New shortcuts go last. Move earlier/later swaps with the neighbour in one transaction; at either end
     it is a no-op that still returns 200.
5. Security and data flow
   - Every Route Handler calls `requireSession()` first. The Server Component calls `requirePageSession()`.
   - The list renders behind `<Suspense>` with a skeleton of the same height as one tile row, so the day and
     date on Home stay instant.
   - Mutations go through the API, then `router.refresh()`. A failed mutation shows an error and leaves the
     list unchanged.

## API

All JSON, using the platform error shape. Mutations are subject to the proxy's Origin check.

| Method and path                 | Body                          | Success                                       |
| ------------------------------- | ----------------------------- | --------------------------------------------- |
| `GET /api/shortcuts`            | —                             | `200 { items: Shortcut[] }` in order          |
| `POST /api/shortcuts`           | `{ title, url }`              | `201 Shortcut`                                |
| `PATCH /api/shortcuts/[id]`     | `{ title?, url? }` (min one)  | `200 Shortcut`, `404` if unknown              |
| `DELETE /api/shortcuts/[id]`    | —                             | `204`, `404` if unknown                       |
| `POST /api/shortcuts/[id]/move` | `{ direction: 'up'\|'down' }` | `200 { items: Shortcut[] }`, `404` if unknown |

A malformed `id` (not a UUID) returns `404`.

## Data model

```ts
// features/shortcuts/schema.ts
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
```

## Project Structure

```
features/shortcuts/
  schema.ts                      table
  validation.ts                  normalizeUrl, Zod bodies (usable from client and server)
  favicon.ts                     faviconUrl(url)
  dal.ts                         list/create/update/remove/move (server-only)
  components/
    shortcuts-section.tsx        async Server Component: session + list
    shortcut-grid.tsx            client: tiles, edit mode
    shortcut-dialog.tsx          client: add/edit/delete form
    shortcut-icon.tsx            client: favicon with letter fallback
    shortcuts-skeleton.tsx       Suspense fallback
app/api/shortcuts/route.ts, [id]/route.ts, [id]/move/route.ts
features/auth/require-session.ts + requirePageSession(): redirects to /login without a valid session
components/ui/dialog.tsx         via shadcn CLI
app/(app)/error.tsx              message + retry, so one failing section does not take down the shell
tests/session.ts                 signed-in cookie jar for Route Handler tests
lib/api.ts                       + isUuid(), for 404 on malformed ids
```

Shared with `todos`: `requirePageSession()` and the Route Handler pattern.

## Commands

`pnpm dev | build | lint | typecheck | test`, `pnpm db:generate`, `pnpm db:migrate`.
Cloud migration: `DATABASE_URL_MIGRATE='…' pnpm db:migrate` (owner runs it).

## Testing Strategy

- **Unit:** `normalizeUrl` (bare domain, scheme kept, `javascript:`, `ftp:`, credentials, whitespace, too
  long), `faviconUrl`, Zod bodies.
- **Integration (test DB):** DAL order and move (including both ends), Route Handlers for 200/201/204/400/404
  and 401 without a session.
- **HTTP smoke:** create, list, move, delete with a session cookie against `next start`.
- **Browser E2E:** still deferred. The owner checks Home by hand at the checkpoint.

## Boundaries

- **Always:** tables in `daily_tab`; `requireSession()` in every handler; render URLs only after they passed
  `normalizeUrl` (never a `javascript:` href).
- **Ask first:** new dependencies (`dialog` needs none: Base UI is installed); running the cloud migration.
- **Never:** send anything but the hostname to the favicon service; proxy favicons through our server.

## Success Criteria

- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` pass.
- [ ] Without a session, every `/api/shortcuts*` route returns 401.
- [ ] `POST` with `javascript:alert(1)` returns 400; with `github.com` stores `https://github.com/`.
- [ ] Moving the first item earlier and the last item later changes nothing and returns 200.
- [ ] Home's frame renders before the shortcut list arrives.
- [ ] A tile with a failing icon shows the title's first letter.
- [ ] Owner: add, edit, reorder, delete and open shortcuts at desktop and mobile width.
- [ ] Deployed: the same flow works on https://daily-tab.vercel.app and the Android PWA.

## Not Doing (and why)

- **Drag and drop:** owner chose up/down buttons; no new dependency, reliable on touch and keyboard.
- **Folders, tags, pinning:** shortcuts are a short flat list; organised links belong in `bookmarks`.
- **Fetching page titles automatically:** the owner types a short title that fits a tile.
- **Click counts or "most used":** not requested.
