# Tasks: shortcuts and todos

Plan: [plan.md](plan.md) · Specs: [SPEC-shortcuts.md](../SPEC-shortcuts.md), [SPEC-todos.md](../SPEC-todos.md)

Standing verification for every task: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`. Write tests
first. Read the relevant guide in `node_modules/next/dist/docs/` before using a Next.js API.

## Shortcuts (`feat/shortcuts`)

- [x] **Task 0: Prep**
  - Acceptance: spec and plan committed; auth plan archived; `next.config.ts` unchanged from `master`.
  - Scope: XS

- [x] **Task 1: Shared session and test foundations**
  - Description: `requirePageSession()` redirects to `/login` without a valid session; `tests/session.ts`
    provides a signed-in cookie jar for Route Handler tests; `isUuid()` in `lib/api.ts`.
  - Acceptance:
    - [x] Valid cookie returns the session; missing or forged cookie calls `redirect('/login')`.
    - [x] `isUuid` accepts a v4 UUID and rejects other strings.
  - Verify: `pnpm test features/auth lib`
  - Dependencies: none
  - Files: `features/auth/require-session.ts`, `features/auth/require-session.test.ts`, `tests/session.ts`,
    `lib/api.ts`, `lib/api.test.ts`
  - Scope: M

- [x] **Task 2: Shortcuts data and read API**
  - Description: `shortcuts` table, migration, `listShortcuts`, `GET /api/shortcuts`.
  - Acceptance:
    - [x] List is ordered by position, then creation time.
    - [x] No session → 401; migration only touches `daily_tab`.
  - Verify: `pnpm test features/shortcuts app/api/shortcuts`; `pnpm db:migrate`
  - Dependencies: Task 1
  - Files: `features/shortcuts/schema.ts`, `features/shortcuts/dal.ts`, `features/shortcuts/dal.test.ts`,
    `app/api/shortcuts/route.ts`, `app/api/shortcuts/route.test.ts`, `drizzle/0002_*`
  - Scope: M

- [x] **Task 3: Home shows shortcuts**
  - Description: Server section behind Suspense, tiles as links, icon with letter fallback, skeleton,
    `(app)/error.tsx`.
  - Acceptance:
    - [x] The letter shows until the icon has loaded; a failing icon leaves the letter.
    - [x] Only the hostname reaches the favicon service (`faviconUrl` test, `no-referrer`).
    - [x] Weekday and date do not wait for the list; Home stays in the static shell (`pnpm build`).
  - Verify: `pnpm test features/shortcuts`; `pnpm build`; screenshot
  - Dependencies: Task 2
  - Files: `features/shortcuts/favicon.ts` (+ test), `features/shortcuts/components/*`,
    `app/(app)/page.tsx`, `app/(app)/error.tsx`
  - Scope: L

- [x] **Task 4: Add a shortcut**
  - Description: `normalizeUrl` and Zod bodies, `createShortcut`, `POST /api/shortcuts`, add dialog.
  - Acceptance:
    - [x] `github.com` stores `https://github.com/`; `javascript:alert(1)` and credentials → 400.
    - [x] New shortcut goes last and appears after `router.refresh()`.
  - Verify: `pnpm test features/shortcuts app/api/shortcuts`
  - Dependencies: Task 3
  - Files: `features/shortcuts/validation.ts` (+ test), `features/shortcuts/dal.ts`,
    `app/api/shortcuts/route.ts`, `features/shortcuts/components/shortcut-dialog.tsx`, `components/ui/dialog.tsx`
  - Scope: M

- [x] **Task 5: Edit and delete a shortcut**
  - Description: Edit mode, `PATCH` and `DELETE /api/shortcuts/[id]`, delete with a second press.
  - Acceptance:
    - [x] Unknown or malformed id → 404; empty PATCH → 400; DELETE → 204.
    - [x] In edit mode tiles are not links.
  - Verify: `pnpm test app/api/shortcuts features/shortcuts`
  - Dependencies: Task 4
  - Files: `app/api/shortcuts/[id]/route.ts` (+ test), `features/shortcuts/dal.ts`,
    `features/shortcuts/components/shortcut-grid.tsx`, `features/shortcuts/components/shortcut-dialog.tsx`
  - Scope: M

- [x] **Task 6: Reorder shortcuts**
  - Description: `moveShortcut` in a transaction, `POST /api/shortcuts/[id]/move`, move buttons.
  - Acceptance:
    - [x] Moving swaps neighbours; at either end it is a no-op returning 200.
  - Verify: `pnpm test app/api/shortcuts features/shortcuts`
  - Dependencies: Task 5
  - Files: `features/shortcuts/dal.ts`, `features/shortcuts/dal.test.ts`, `app/api/shortcuts/[id]/move/route.ts`
    (+ test), `features/shortcuts/components/shortcut-grid.tsx`
  - Scope: S

## Checkpoint A: Shortcuts work locally

- [x] Gates pass; curl CRUD smoke with a session cookie
- [x] Owner's browser check (desktop + mobile width)

- [ ] **Task 7: Release shortcuts (human-gated)**
  - Acceptance:
    - [ ] Owner ran the cloud migration before merge.
    - [ ] Production smoke passes; shortcuts work in the Android PWA.

## Todos (`feat/todos`, from `master` after Task 7)

- [x] **Task 8: Todos data model and validation**
  - Files: `features/todos/schema.ts`, `features/todos/validation.ts` (+ test), `drizzle/0003_*`, `lib/api.ts`
    (+ test)
  - Acceptance:
    - [x] Project names unique ignoring case; `ON DELETE SET NULL`; `conflict` maps to 409.
  - Scope: M

- [x] **Task 9: Todos read API**
  - Files: `features/todos/dal.ts` (+ test), `app/api/todos/route.ts` (+ test), `app/api/projects/route.ts`
    (+ test)
  - Acceptance:
    - [x] Filter handles project, `none` and unknown; pending counts are correct; no session → 401.
  - Scope: M

- [x] **Task 10: `/todos` page**
  - Files: `app/(app)/todos/page.tsx`, `features/todos/components/{todos-view,project-filter,todo-list,todos-skeleton}.tsx`
  - Acceptance:
    - [x] Filter from the URL; pending oldest first; Completed collapsed; `searchParams` awaited inside Suspense.
  - Scope: M

- [x] **Task 11: Add and tick todos**
  - Files: `app/api/todos/route.ts`, `app/api/todos/[id]/route.ts` (+ test), `features/todos/dal.ts`,
    `features/todos/components/{add-todo-form,todo-row}.tsx`, `components/ui/checkbox.tsx`
  - Acceptance:
    - [x] Enter adds and keeps focus; ticking is immediate and reverts with an error if the request fails.
  - Scope: M

- [x] **Task 12: Edit and delete todos**
  - Files: `app/api/todos/[id]/route.ts`, `features/todos/dal.ts`, `features/todos/components/todo-dialog.tsx`
  - Acceptance:
    - [x] Unknown `projectId` → 400; unknown or malformed id → 404; delete needs a second press.
  - Scope: M

- [x] **Task 13: Manage projects**
  - Files: `app/api/projects/route.ts`, `app/api/projects/[id]/route.ts` (+ test), `features/todos/dal.ts`,
    `features/todos/components/project-manager.tsx`
  - Acceptance:
    - [x] "Work" when "work" exists → 409; deleting a project keeps its todos under No project.
  - Scope: M

- [x] **Task 14: Pending tasks on Home**
  - Files: `features/todos/components/pending-section.tsx`, `features/todos/dal.ts`, `app/(app)/page.tsx`
  - Acceptance:
    - [x] At most 5 oldest pending, tickable; "View all (N)" shows the true total.
  - Scope: S

- [x] **Task 14b: Optional link and notes on a todo (added by owner)**
  - Files: `features/todos/{schema,validation,dal,optimistic}.ts`, `drizzle/0004_*`, `lib/url.ts` (+ test),
    `features/todos/components/{todo-list,todo-dialog}.tsx`, `components/ui/textarea.tsx`
  - Acceptance:
    - [x] Link uses the shortcut URL rules; empty input clears link and notes.
    - [x] The link does not tick the todo; notes show on `/todos`, not on Home.
  - Scope: M

- [x] **Task 14c: Create todos in a dialog (added by owner)**
  - Files: `features/todos/components/{add-todo-button,todo-dialog,todos-view}.tsx`
  - Acceptance:
    - [x] "Add todo" opens the dialog; the project defaults to the active filter; delete only shows when editing.
  - Scope: S

## Checkpoint B: Todos work locally

- [x] Gates pass; curl CRUD smoke with a session cookie
- [ ] Owner's browser check (desktop + mobile width)

- [ ] **Task 15: Release todos (human-gated)**
  - Acceptance:
    - [ ] Owner ran the cloud migration before merge.
    - [ ] Production smoke passes; todos work in the Android PWA.
