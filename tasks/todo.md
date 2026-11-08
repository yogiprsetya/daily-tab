# Tasks: bookmarks

Plan: [plan.md](plan.md) · Spec: [SPEC-bookmarks.md](../SPEC-bookmarks.md)

Standing verification for every task: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`. Write tests first.
Local migrations pass a local URL explicitly.

## Shared components

- [x] **Task 1: Shared filter**
  - Description: Move the scrolling nav and link from `features/todos/components/project-filter{,-nav}.tsx` to
    `components/grouping/{filter-nav,filter-link}.tsx`; todos uses them.
  - Acceptance:
    - [x] Todos filter looks and behaves the same; todos tests unchanged.
  - Verify: `pnpm test`; browser script
  - Dependencies: none
  - Scope: M

- [x] **Task 2: Shared select, manager and site icon**
  - Description: `GroupSelect`, `GroupManager` (endpoint + copy) in `components/grouping/`; `components/site-icon.tsx`
    from `features/shortcuts/components/shortcut-icon.tsx`.
  - Acceptance:
    - [x] Existing tests pass unchanged; todos, Select and shortcuts browser scripts pass.
  - Verify: `pnpm test`; browser scripts
  - Dependencies: Task 1
  - Scope: M

## Checkpoint A: No regressions

- [x] Gates pass; browser scripts pass

## Bookmarks

- [x] **Task 3: Data model and validation**
  - Description: `features/bookmarks/schema.ts`, migration `0005`, Zod bodies, `parseFolderFilter`, `escapeLike`; move
    `translatePgError` to `db/pg-errors.ts`.
  - Acceptance:
    - [x] URL and folder names unique; deleting a folder sets `folder_id` to null.
  - Verify: `pnpm test features/bookmarks`
  - Dependencies: none
  - Scope: M

- [x] **Task 4: Read API**
  - Description: `listBookmarks` (folder, `q`, newest first), `listFolders` with counts, `GET /api/bookmarks`,
    `GET /api/bookmark-folders`.
  - Acceptance:
    - [x] `%` matches literally; unknown folder behaves as All; 401 without a session.
  - Verify: `pnpm test features/bookmarks app/api/bookmark`
  - Dependencies: Task 3
  - Scope: M

- [x] **Task 5: `/bookmarks` page**
  - Description: Replace the placeholder: filter, rows, empty states, skeleton.
  - Acceptance:
    - [x] `?folder=garbage` shows All; the page stays partially static.
  - Verify: `pnpm build`; browser script
  - Dependencies: Tasks 2, 4
  - Scope: M

- [x] **Task 6: Add, edit and delete**
  - Description: `POST`, `PATCH`, `DELETE`, "Add bookmark" right of the filter, dialog.
  - Acceptance:
    - [x] A duplicate URL after normalization returns 409 with the message on the URL field; delete needs a second press.
  - Verify: `pnpm test app/api/bookmarks`; browser script
  - Dependencies: Task 5
  - Scope: M

- [x] **Task 7: Manage folders**
  - Description: `POST`, `PATCH`, `DELETE /api/bookmark-folders`, wired to `GroupManager`.
  - Acceptance:
    - [x] Deleting a folder keeps its bookmarks under No folder; duplicate name 409.
  - Verify: `pnpm test app/api/bookmark-folders`; browser script
  - Dependencies: Tasks 2, 5
  - Scope: M

- [x] **Task 8: Search**
  - Description: Input with a short pause, `router.replace` keeps the active folder.
  - Acceptance:
    - [x] Combines with the folder, survives a reload, keeps focus while typing.
  - Verify: browser script
  - Dependencies: Task 5
  - Scope: S

## Checkpoint B: Works locally

- [x] Gates pass; browser script passes
- [ ] Owner's browser check (desktop + mobile width)

- [ ] **Task 9: Release (human-gated)**
  - Acceptance:
    - [ ] Owner ran the cloud migration before merge.
    - [ ] Production smoke passes; bookmarks work in the Android PWA.
