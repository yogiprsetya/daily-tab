# Spec: reading-list

Status: **Approved 2026-11-09**
Module id: `reading-list` (see [CAPABILITY-MAP.md](CAPABILITY-MAP.md)) · Depends on: `auth`

## Objective

Keep a queue of links to read later: save a link, group it by topic, work through the oldest first, and mark it
as read. Items that have been read stay available as a history. Used on desktop and Android, inside the app only.

### Acceptance criteria

1. Items
   - An item has a title (1–120 characters after trim), a URL, an optional note (up to 2000 characters) and at
     most one topic. URL rules match bookmarks (`http`/`https` only; a bare domain gets `https://`; embedded
     credentials are rejected).
   - The same URL cannot be saved twice, whether the existing item is unread or read: `409` and the message
     "This URL is already on your reading list".
   - Add and edit happen in a dialog opened by "Add link", to the right of the filter. Delete is in the edit
     dialog and needs a second press. The topic defaults to the active filter.
2. List
   - Unread items come first, oldest first, as rows: checkbox, icon, title, domain, note (up to 2 lines) and,
     under All, the topic name.
   - Below them, a collapsed **Read** section with its count lists read items, most recently read first.
   - The title opens the URL in a new tab and does not change the read state. A separate button opens the edit
     dialog.
   - The icon uses `SiteIcon` (favicon with the title's first letter as fallback).
   - Empty states: "Nothing to read yet" with an add action, and "Nothing unread here" when a filter has no
     unread items.
3. Marking as read
   - The checkbox marks an item read or unread. It updates immediately and reverts with an error message if the
     request fails, as ticking a todo does.
   - Marking an item unread clears `readAt`, and it returns to its original place in the queue.
   - Marking an already-read item as read keeps its original `readAt`.
4. Topics and filter
   - Topics are one level deep. Names are unique ignoring case (1–50 characters after trim); a duplicate returns
     `409`.
   - Filter as a joined button group: All, each topic, No topic, each with its **unread** count. It scrolls
     sideways when it does not fit and keeps the active filter in view.
   - The filter lives in the URL: `/reading-list?topic=<uuid>` or `?topic=none`, and applies to both the unread
     list and the Read section. An unknown or malformed value behaves as All.
   - Topics are created, renamed and deleted from a dialog. Deleting one asks for a second press and moves its
     items to No topic; no item is deleted.
5. Security and data flow
   - Every Route Handler calls `requireSession()`; the page calls `requirePageSession()`.
   - The list renders behind `<Suspense>`, so the page frame stays instant.
   - Mutations go through the API, then `useInvalidate()` refreshes the items and topics caches.
   - All controls are keyboard reachable, labelled, and at least 44px tall.

## API

| Method and path                   | Body or query                                         | Success                           |
| --------------------------------- | ----------------------------------------------------- | --------------------------------- |
| `GET /api/reading-items`          | `?topic=<uuid>\|none`                                 | `200 { items: ReadingItem[] }`    |
| `POST /api/reading-items`         | `{ title, url, notes?, topicId? }`                    | `201 ReadingItem`, `409` on dup   |
| `PATCH /api/reading-items/[id]`   | `{ title?, url?, notes?, topicId?, read? }` (min one) | `200`, `404`, `409`               |
| `DELETE /api/reading-items/[id]`  | —                                                     | `204`, `404`                      |
| `GET /api/reading-topics`         | —                                                     | `200 { items: TopicWithCount[] }` |
| `POST /api/reading-topics`        | `{ name }`                                            | `201`, `409` on duplicate         |
| `PATCH /api/reading-topics/[id]`  | `{ name }`                                            | `200`, `404`, `409`               |
| `DELETE /api/reading-topics/[id]` | —                                                     | `204`, `404`                      |

A `topicId` that does not exist returns `400`. A malformed `id` returns `404`.

## Data model

Migration `0006_reading_list`, additive.

```ts
// features/reading-list/schema.ts
export const readingTopics = dailyTab.table(
  'reading_topics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex('reading_topics_name_lower_idx').on(sql`lower(${t.name})`),
  ]
);

export const readingItems = dailyTab.table(
  'reading_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    url: text('url').notNull(),
    notes: text('notes'),
    topicId: uuid('topic_id').references(() => readingTopics.id, {
      onDelete: 'set null',
    }),
    // Null means unread.
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex('reading_items_url_idx').on(t.url),
    index('reading_items_created_at_idx').on(t.createdAt),
    index('reading_items_topic_id_idx').on(t.topicId),
  ]
);
```

## Tech Stack

As in [SPEC-platform.md](SPEC-platform.md). No new dependencies.

## Project Structure

```
features/reading-list/
  schema.ts, validation.ts, dal.ts, api-errors.ts      + tests
  components/
    reading-view.tsx                  async Server Component: session, URL, data
    reading-list.tsx, reading-dialog.tsx, add-reading-button.tsx
    reading-skeleton.tsx
app/api/reading-items/route.ts, [id]/route.ts
app/api/reading-topics/route.ts, [id]/route.ts
app/(app)/reading-list/page.tsx       replaces the placeholder
```

Reused without changes: `components/grouping/*` (`FilterNav`, `FilterLink`, `GroupSelect`, `GroupManager`),
`components/site-icon.tsx`, `db/pg-errors.ts`, `lib/url.ts`, `lib/api.ts`, `lib/api-client.ts`.

## Commands

`pnpm dev | build | lint | typecheck | test`, `pnpm db:generate`, `pnpm db:migrate`.
Local migrations pass a local URL explicitly. Cloud migration: `DATABASE_URL_MIGRATE='…' pnpm db:migrate` (owner
runs it).

## Code Style

As in [SPEC-platform.md](SPEC-platform.md), and mirror `features/bookmarks` for file layout, DAL shape and route
handlers, and `features/todos` for the checkbox and the collapsed section.

## Testing Strategy

- **Unit:** Zod bodies, filter parsing.
- **Integration (test DB):** unread ordering (oldest first), read ordering (most recently read first), topic filter
  (id, none, unknown) on both sections, unread counts, duplicate URL against both unread and read items, duplicate
  topic names, `read` true and false (including that a repeat keeps `readAt`), deleting a topic keeps its items,
  every route for 200/201/204/400/404/409 and 401 without a session.
- **Regression:** existing tests pass unchanged, since the shared components are reused as they are.
- **Browser E2E:** still deferred. The owner checks by hand at the checkpoint.

## Boundaries

- **Always:** tables in `daily_tab`; `requireSession()` in every handler; shadcn components for controls; validate
  that `topicId` exists; read the relevant guide in `node_modules/next/dist/docs/` before using a Next.js API.
- **Ask first:** new dependencies; running the cloud migration; changing the shared `components/grouping` API.
- **Never:** delete items as a side effect of deleting a topic; `drizzle-kit push` against the cloud database.

## Success Criteria

- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` pass.
- [ ] Without a session, every `/api/reading-items*` and `/api/reading-topics*` route returns 401.
- [ ] Saving a URL twice returns 409 with the message above, including after normalization and when the existing
      item is already read.
- [ ] The oldest unread item is on top; the most recently read item is first in the Read section.
- [ ] Marking an item read and then unread returns it to its original place in the queue.
- [ ] A failed checkbox request reverts the row and shows an error.
- [ ] Deleting a topic leaves its items under No topic.
- [ ] `/reading-list?topic=garbage` shows All; a valid topic filters both sections.
- [ ] Owner: add, edit, delete, open, mark read and unread, filter and manage topics at desktop and mobile width.
- [ ] Deployed: the same flow works on https://daily-tab.vercel.app and the Android PWA.

## Not Doing (and why)

- **Items without a URL (books, papers):** owner chose links only.
- **A section on Home:** owner decision; Home holds shortcuts and pending todos.
- **Search:** not requested; the list is a queue that shrinks as it is read. Add it if the Read history grows.
- **Fetching page titles, read-time estimates or an in-app reader:** the owner types a title; a server-side fetch
  adds failure modes.
- **Saving from the browser or share sheet:** outside this module; `newtab-extension` and the PWA could add it later.
- **Tags, nested topics, manual reordering and pagination:** not requested.

## Open Questions

- The groups are called **topics** here (bookmarks have folders, todos have projects). Is that the word you want?
- The capability map describes this module as "add, mark as read". On approval, add grouping to its row.
