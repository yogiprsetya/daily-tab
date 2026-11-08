# Implementation Plan: bookmarks

Spec: [SPEC-bookmarks.md](../SPEC-bookmarks.md) · Map: [CAPABILITY-MAP.md](../CAPABILITY-MAP.md) · Tasks: [todo.md](todo.md)
Previous modules: [archive/](archive/)

## Overview

Save, group and find links inside the app: one-level folders, a search field, and the same popup and button-group
patterns as todos. Stacked on `chore/remove-home-header` (PR #5) until that merges.

## Architecture Decisions

- **Extract before building.** The filter, group select, group manager and site icon move to shared components first,
  with todos and shortcuts tests unchanged.
- **Generic `GroupManager`** takes an endpoint and UI copy, so todos' wording stays exactly the same.
- **No `useSearchParams` for search:** the server passes `q` and the folder as props, so no extra Suspense is needed.
  Filter links carry `q`.
- **Search** uses `ilike` through Drizzle parameters, with `%`, `_` and `\` escaped.
- **`translatePgError`** moves from `features/todos/dal.ts` to `db/pg-errors.ts`.

## Task List

### Shared components

- [x] Task 1: Shared filter (`FilterNav`, `FilterLink`)
- [x] Task 2: Shared select, manager and site icon

### Checkpoint A: No regressions

- [ ] Gates pass; todos, Select and shortcuts browser scripts pass

### Bookmarks

- [x] Task 3: Data model and validation
- [x] Task 4: Read API
- [x] Task 5: `/bookmarks` page
- [x] Task 6: Add, edit and delete
- [x] Task 7: Manage folders
- [x] Task 8: Search

### Checkpoint B: Works locally

- [x] Gates pass; browser script passes
- [ ] Owner checks in a browser (desktop + mobile width)

- [ ] Task 9: Release (human-gated)

## Risks and Mitigations

| Risk                                                          | Impact | Mitigation                                                     |
| ------------------------------------------------------------- | ------ | -------------------------------------------------------------- |
| Extraction changes todos behaviour                            | Med    | Separate first step, tests unchanged, browser scripts re-run   |
| `db:migrate` hits the cloud database (`.env` may point there) | High   | Always pass a local URL explicitly                             |
| Merging before migration `0005`                               | Med    | Only `/bookmarks` is affected; required step in the PR         |
| Search input loses focus on `router.replace`                  | Med    | Client component stays mounted outside Suspense; browser check |

## Open Questions

None blocking.
