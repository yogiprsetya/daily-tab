# Implementation Plan: shortcuts and todos

Specs: [SPEC-shortcuts.md](../SPEC-shortcuts.md), [SPEC-todos.md](../SPEC-todos.md) · Map: [CAPABILITY-MAP.md](../CAPABILITY-MAP.md) · Tasks: [todo.md](todo.md)
Previous modules: [archive/](archive/)

## Overview

Fill Home with the owner's shortcuts and pending todos, and turn `/todos` into the full list with a project
filter. Shipped as two sequential PRs: `feat/shortcuts`, then `feat/todos` from `master` after the first
merge.

## Architecture Decisions

- **Vertical slices by user capability.** Each task leaves the app working; a placeholder is replaced only
  when its slice is ready.
- **Reads in Server Components** behind `<Suspense>`, calling `requirePageSession()`. `cookies()` makes them
  request-time, so no `connection()` is needed and the page frame stays static.
- **Mutations through Route Handlers**, then `router.refresh()`. Ticking a todo uses `useOptimistic`.
- **Ordering:** `order by position, created_at`; a move swaps `position` inside `db.transaction`.
- **Duplicate project names:** catch Postgres `23505` in the DAL (read from `error.cause`, as Drizzle wraps
  driver errors), return 409.

## Task List

### Shortcuts

- [x] Task 0: Prep branch, specs, task list
- [x] Task 1: Shared session and test foundations
- [x] Task 2: Shortcuts data and read API
- [x] Task 3: Home shows shortcuts
- [ ] Task 4: Add a shortcut
- [ ] Task 5: Edit and delete a shortcut
- [ ] Task 6: Reorder shortcuts

### Checkpoint A: Shortcuts work locally

- [ ] Gates pass; curl CRUD smoke with a session cookie
- [ ] Owner checks shortcuts in a browser (desktop + mobile width)

- [ ] Task 7: Release shortcuts (human-gated)

### Todos

- [ ] Task 8: Todos data model and validation
- [ ] Task 9: Todos read API
- [ ] Task 10: `/todos` page
- [ ] Task 11: Add and tick todos
- [ ] Task 12: Edit and delete todos
- [ ] Task 13: Manage projects
- [ ] Task 14: Pending tasks on Home

### Checkpoint B: Todos work locally

- [ ] Gates pass; curl CRUD smoke with a session cookie
- [ ] Owner checks todos in a browser (desktop + mobile width)

- [ ] Task 15: Release todos (human-gated)

## Risks and Mitigations

| Risk                                                                     | Impact | Mitigation                                                                            |
| ------------------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------- |
| Merging before the cloud migration: queries on new tables fail on Home   | High   | Required step in each PR checklist; `(app)/error.tsx` contains the blast radius       |
| DB read outside `<Suspense>` fails the Cache Components build            | Med    | Session and queries only in async components inside Suspense; `pnpm build` every task |
| Deleting a project deletes todos                                         | High   | `ON DELETE SET NULL` + integration test                                               |
| DuckDuckGo favicons slow or blocked (timed out from the agent's network) | Low    | Letter shows first; owner checks at Checkpoint A                                      |
| `useOptimistic` out of sync after `router.refresh()`                     | Med    | Toggle in `startTransition`; refresh after success; manual check                      |
| DB tests racing                                                          | Med    | `fileParallelism: false`; truncate in `beforeEach`                                    |

## Open Questions

None blocking.
