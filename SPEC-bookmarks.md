# Spec: bookmarks

Status: **Approved 2026-11-08**
Module id: `bookmarks` (see [CAPABILITY-MAP.md](CAPABILITY-MAP.md)) · Depends on: `auth`

## Objective

Replace browser bookmarks: save links, keep them in simple folders, and find them again quickly, all inside
the app on desktop and Android. There is no browser integration or import (owner decision).

### Acceptance criteria

1. Bookmarks
   - A bookmark has a title (1–120 characters after trim), a URL, an optional note (up to 2000 characters) and
     at most one folder. URL rules match shortcuts and todos (`http`/`https` only; a bare domain gets
     `https://`; embedded credentials are rejected).
   - The same URL cannot be saved twice: `409` and the message "This URL is already bookmarked".
   - Add and edit happen in a dialog opened by "Add bookmark", to the right of the filter. Delete is in the
     edit dialog and needs a second press. The folder defaults to the active filter.
2. List
   - Newest first, as rows: icon, title, domain, note (up to 2 lines) and, under All, the folder name.
   - The title opens the URL in a new tab. A separate button opens the edit dialog.
   - The icon uses the DuckDuckGo favicon service with the title's first letter as fallback, as shortcuts do.
   - Empty states: "No bookmarks yet" with an add action, and "No bookmarks match" when filtering or searching.
3. Folders and filter
   - Folders are one level deep. Names are unique ignoring case (1–50 characters after trim); a duplicate returns
     `409`.
   - Filter as a joined button group: All, each folder, No folder, each with its bookmark count. It scrolls
     sideways when it does not fit and keeps the active filter in view.
   - The filter lives in the URL: `/bookmarks?folder=<uuid>` or `?folder=none`. An unknown or malformed value
     behaves as All.
   - Folders are created, renamed and deleted from a dialog. Deleting one asks for a second press and moves its
     bookmarks to No folder; no bookmark is deleted.
4. Search
   - A search field filters by title, URL and note, ignoring case, combined with the active folder.
   - The query lives in the URL (`?q=`), so it survives a reload. Typing updates it after a short pause.
   - `%`, `_` and `\` in a query match literally.
5. Security and data flow
   - Every Route Handler calls `requireSession()`; the page calls `requirePageSession()`.
   - The list renders behind `<Suspense>`, so the page frame stays instant.
   - Mutations go through the API, then `router.refresh()`.
   - All controls are keyboard reachable, labelled, and at least 44px tall.

## API

| Method and path                     | Body or query                                   | Success                            |
| ----------------------------------- | ----------------------------------------------- | ---------------------------------- |
| `GET /api/bookmarks`                | `?folder=<uuid>\|none&q=`                       | `200 { items: Bookmark[] }`        |
| `POST /api/bookmarks`               | `{ title, url, notes?, folderId? }`             | `201 Bookmark`, `409` on duplicate |
| `PATCH /api/bookmarks/[id]`         | `{ title?, url?, notes?, folderId? }` (min one) | `200`, `404`, `409`                |
| `DELETE /api/bookmarks/[id]`        | —                                               | `204`, `404`                       |
| `GET /api/bookmark-folders`         | —                                               | `200 { items: FolderWithCount[] }` |
| `POST /api/bookmark-folders`        | `{ name }`                                      | `201`, `409` on duplicate          |
| `PATCH /api/bookmark-folders/[id]`  | `{ name }`                                      | `200`, `404`, `409`                |
| `DELETE /api/bookmark-folders/[id]` | —                                               | `204`, `404`                       |

A `folderId` that does not exist returns `400`. A malformed `id` returns `404`.

## Data model

```ts
// features/bookmarks/schema.ts
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
```

## Project Structure

```
features/bookmarks/
  schema.ts, validation.ts, dal.ts      + tests
  components/
    bookmarks-view.tsx                  async Server Component: session, URL, data
    bookmark-list.tsx, bookmark-dialog.tsx, add-bookmark-button.tsx, bookmark-search.tsx
    bookmarks-skeleton.tsx
app/api/bookmarks/route.ts, [id]/route.ts
app/api/bookmark-folders/route.ts, [id]/route.ts
app/(app)/bookmarks/page.tsx            replaces the placeholder
```

Shared with `todos` and `shortcuts`, extracted instead of copied:

```
components/grouping/
  filter-nav.tsx, filter-link.tsx       button-group filter that keeps the active item in view
  group-select.tsx                      shadcn Select for "no group" or one group
  group-manager.tsx                     dialog to create, rename and delete groups
components/site-icon.tsx                moved from features/shortcuts (favicon with letter fallback)
```

## Commands

`pnpm dev | build | lint | typecheck | test`, `pnpm db:generate`, `pnpm db:migrate`.
Local migrations pass a local URL explicitly. Cloud migration: `DATABASE_URL_MIGRATE='…' pnpm db:migrate` (owner
runs it).

## Testing Strategy

- **Unit:** Zod bodies, filter parsing, LIKE escaping.
- **Integration (test DB):** ordering, folder filter (id, none, unknown), search across title, URL and note,
  literal `%` and `_`, counts, duplicate URL and folder names, deleting a folder keeps bookmarks, every route
  for 200/201/204/400/404/409 and 401 without a session.
- **Regression:** existing todos and shortcuts tests pass unchanged after the shared components are extracted;
  headless browser re-check of the todos filter, project select and project manager.
- **Browser E2E:** still deferred. The owner checks by hand at the checkpoint.

## Boundaries

- **Always:** tables in `daily_tab`; `requireSession()` in every handler; shadcn components for controls; validate
  `folderId` exists.
- **Ask first:** new dependencies; running the cloud migration.
- **Never:** delete bookmarks as a side effect of deleting a folder; interpolate a search query into SQL.

## Success Criteria

- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` pass.
- [ ] Without a session, every `/api/bookmarks*` and `/api/bookmark-folders*` route returns 401.
- [ ] Saving a URL twice returns 409 with the message above, including after normalization (`github.com` and
      `https://github.com/`).
- [ ] Deleting a folder leaves its bookmarks under No folder.
- [ ] `/bookmarks?folder=garbage` shows All; search combines with the folder and survives a reload.
- [ ] Searching `100%` matches only titles containing that literal text.
- [ ] Owner: add, edit, delete, open, filter, search and manage folders at desktop and mobile width.
- [ ] Deployed: the same flow works on https://daily-tab.vercel.app and the Android PWA.

## Not Doing (and why)

- **Browser import, sync or extension:** owner decision; bookmarks are managed in the app.
- **Tags and nested folders:** owner chose one-level folders.
- **Fetching page titles or screenshots:** the owner types a title; a server-side fetch adds failure modes.
- **Dead-link checking and archiving:** not requested.
- **Pagination:** the list is hand-curated; add it if it proves necessary.
- **A bookmarks section on Home:** Home holds shortcuts and pending tasks.
