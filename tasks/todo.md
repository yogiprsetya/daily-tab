# Tasks: reading-list

Plan: [plan.md](plan.md) · Spec: [SPEC-reading-list.md](../SPEC-reading-list.md)

Standing verification for every task: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`. Write tests first.
Local migrations pass a local URL explicitly. File counts below exclude tests.

## Before starting

- [x] Owner approves the spec and this plan; group name confirmed (`topics`)
- [x] Set the spec status to Approved; add grouping to the `reading-list` row in `CAPABILITY-MAP.md`

## Queue on screen

- [ ] **Task 1: Data model and validation**
  - Description: `features/reading-list/schema.ts`, migration `0006_reading_list`, Zod bodies (including `read`) and
    `parseTopicFilter` in `validation.ts`.
  - Acceptance:
    - [ ] URL and lower-cased topic name are unique; deleting a topic sets `topic_id` to null.
    - [ ] Bodies enforce the title, note and URL rules; an empty `PATCH` is rejected.
    - [ ] `?topic=` parses to a uuid, `none`, or All for anything else.
  - Verify: `pnpm test features/reading-list`; migration applied to a local database
  - Dependencies: none
  - Files: `schema.ts`, `validation.ts`, `drizzle/0006_*`
  - Scope: S

- [ ] **Task 2: Read queries and `GET /api/reading-items`**
  - Description: `listUnread`, `listRead`, `countUnread`, `unreadWithoutTopic`, `resolveTopicFilter`, `listTopics` with
    unread counts, and the `GET` handler.
  - Acceptance:
    - [ ] Unread is oldest first; Read is most recently read first; the filter applies to both.
    - [ ] Topic counts include unread items only; an unknown topic behaves as All.
    - [ ] 401 without a session.
  - Verify: `pnpm test features/reading-list app/api/reading-items`
  - Dependencies: Task 1
  - Files: `dal.ts`, `app/api/reading-items/route.ts`
  - Scope: M

- [ ] **Task 3: `/reading-list` page with filter**
  - Description: Replace the placeholder: `reading-view.tsx`, read-only rows and Read section in `reading-list.tsx`,
    filter from `FilterNav` and `FilterLink`, empty states, skeleton.
  - Acceptance:
    - [ ] `?topic=garbage` shows All; a valid topic filters both sections.
    - [ ] Both empty states appear as specified; the page stays partially static in `pnpm build`.
  - Verify: `pnpm build`; browser check with seeded local data
  - Dependencies: Task 2
  - Files: `app/(app)/reading-list/page.tsx`, `reading-view.tsx`, `reading-list.tsx`, `reading-filter.tsx`,
    `reading-skeleton.tsx`
  - Scope: M

## Checkpoint A: Page renders

- [ ] Gates pass; seeded items and filter render at desktop and phone width

## Managing items

- [ ] **Task 4: Add a link**
  - Description: `createReadingItem`, `POST /api/reading-items`, `api-errors.ts`, create mode of `reading-dialog.tsx`,
    "Add link" right of the filter, defaulting to the active topic.
  - Acceptance:
    - [ ] A duplicate URL returns 409 with the spec's message on the URL field, after normalization and when the
          existing item is read.
    - [ ] A `topicId` that doesn't exist returns 400.
  - Verify: `pnpm test features/reading-list app/api/reading-items`; browser check
  - Dependencies: Task 3
  - Files: `dal.ts`, `route.ts`, `api-errors.ts`, `reading-dialog.tsx`, `add-reading-button.tsx`
  - Scope: M

- [ ] **Task 5: Edit and delete**
  - Description: `updateReadingItem`, `removeReadingItem`, `PATCH` and `DELETE` on `/api/reading-items/[id]`, edit
    button on rows, edit mode of the dialog.
  - Acceptance:
    - [ ] 200, 400, 404 and 409 as specified; a malformed id returns 404.
    - [ ] Delete needs a second press.
  - Verify: `pnpm test features/reading-list app/api/reading-items`; browser check
  - Dependencies: Task 4
  - Files: `dal.ts`, `[id]/route.ts`, `reading-dialog.tsx`, `reading-list.tsx`
  - Scope: M

- [ ] **Task 6: Mark read and unread**
  - Description: `read` in `updateReadingItem`, `optimistic.ts` that inserts by `createdAt`, checkbox with its own 44px
    label, transition and error handling as in `TodoList`.
  - Acceptance:
    - [ ] Reading then unreading restores the item's place in the queue, with no jump while refreshing.
    - [ ] A repeated `read: true` keeps the original `readAt`.
    - [ ] A failed request reverts the row and shows an error; clicking the title doesn't tick the box.
  - Verify: `pnpm test features/reading-list app/api/reading-items`; browser check at phone width
  - Dependencies: Task 5
  - Files: `dal.ts`, `optimistic.ts`, `reading-list.tsx`
  - Scope: M

## Checkpoint B: Queue works

- [ ] Gates pass; add, edit, delete and read flow works in a browser

## Topics

- [ ] **Task 7: Manage topics**
  - Description: `createTopic`, `updateTopic`, `removeTopic`, `/api/reading-topics` and `[id]` routes (`GET`, `POST`,
    `PATCH`, `DELETE`), `GroupSelect` in the dialog, `GroupManager` in the view.
  - Acceptance:
    - [ ] A duplicate name ignoring case returns 409.
    - [ ] Deleting a topic keeps its items under No topic.
    - [ ] Every route returns 401 without a session.
  - Verify: `pnpm test features/reading-list app/api/reading-topics`; browser check
  - Dependencies: Task 4
  - Files: `dal.ts`, `app/api/reading-topics/route.ts`, `[id]/route.ts`, `reading-view.tsx`, `reading-dialog.tsx`
  - Scope: M

## Checkpoint C: Works locally

- [ ] Gates pass; browser script passes
- [ ] Owner checks in a browser (desktop + mobile width)

- [ ] **Task 8: Release (human-gated)**
  - Acceptance:
    - [ ] Owner ran the cloud migration before merge.
    - [ ] Production smoke passes; the reading list works in the Android PWA.
  - Dependencies: Checkpoint C
  - Scope: XS
