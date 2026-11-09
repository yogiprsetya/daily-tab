# Implementation Plan: reading-list

Spec: [SPEC-reading-list.md](../SPEC-reading-list.md) · Map: [CAPABILITY-MAP.md](../CAPABILITY-MAP.md) · Tasks: [todo.md](todo.md)
Previous modules: [archive/](archive/)

## Overview

A queue of links to read: oldest unread first, a collapsed Read section as history, and topics with the shared filter
and manager. It combines the bookmarks structure (URL items, one-level groups) with the todos checkbox and collapsed
section. Migration `0006` is additive.

## Architecture Decisions

- **Mirror, don't extract.** Everything in `components/grouping`, `SiteIcon`, `translatePgError` and `lib/` is reused
  as it is. The item dialog, routes and DAL follow bookmarks but stay in `features/reading-list`: the fields and
  messages differ, and a generic item module would be harder to read than three plain ones.
- **`read` on `PATCH`, stored as `readAt`.** Same shape as `completed` on todos, using `coalesce(read_at, now())` so a
  repeat keeps the original time.
- **Own `optimistic.ts`.** Todos appends an unticked item to the end of its list. Here the queue is ordered, so the
  unticked item is inserted by `createdAt`; otherwise it would jump to the bottom and back after the refresh. Rows carry
  `createdAt` for this.
- **Checkbox outside any label that holds the link.** The title is a link, so it can't sit inside the checkbox's
  `<label>` as a todo title does. The checkbox gets its own 44px label with `aria-label`, for example "Mark {title} as
  read".
- **Counts are server-rendered.** Filter counts update on `router.refresh()`, as on todos; only the rows are optimistic.

## Task List

### Before starting

- [x] Owner approves the spec and this plan; group name confirmed (`topics`)

### Queue on screen

- [x] Task 1: Data model and validation
- [x] Task 2: Read queries and `GET /api/reading-items`
- [x] Task 3: `/reading-list` page with filter

### Checkpoint A: Page renders

- [x] Gates pass; seeded items and filter render at desktop and phone width

### Managing items

- [x] Task 4: Add a link
- [x] Task 5: Edit and delete
- [x] Task 6: Mark read and unread

### Checkpoint B: Queue works

- [x] Gates pass; add, edit, delete and read flow works in a browser

### Topics

- [x] Task 7: Manage topics

### Checkpoint C: Works locally

- [x] Gates pass; browser script passes
- [x] Owner checks in a browser (desktop + mobile width)

- [x] Task 8: Release (human-gated)

## Risks and Mitigations

| Risk                                                          | Impact | Mitigation                                                      |
| ------------------------------------------------------------- | ------ | --------------------------------------------------------------- |
| `db:migrate` hits the cloud database (`.env` may point there) | High   | Always pass a local URL explicitly; check the host first        |
| Merging before migration `0006`                               | Med    | Only `/reading-list` is affected; required step in the PR       |
| Unticked row jumps while the refresh is in flight             | Med    | Insert by `createdAt` in `optimistic.ts`; unit test and browser |
| Clicking the link ticks the checkbox, or the reverse          | Med    | Link stays outside the label; browser check                     |
| Checkbox target under 44px on phones                          | Low    | Own `min-h-11 min-w-11` label; measured at phone width          |

## Parallelization

Sequential: each task builds on the DAL and components of the one before, and the migration comes first.

## Open Questions

- Group name: `topics` is assumed throughout (tables, routes, `?topic=`, UI copy). Renaming is cheap before Task 1.
