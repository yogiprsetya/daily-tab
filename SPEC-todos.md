# Spec: todos

Status: **Approved 2026-11-08**
Module id: `todos` (see [CAPABILITY-MAP.md](CAPABILITY-MAP.md)) · Depends on: `auth`

## Objective

A fast personal todo list grouped by project, stored in Supabase. `/todos` is the full list with a project
filter; Home shows what is still pending so it is visible on every new tab.

### Acceptance criteria

1. Todos
   - A todo has a title (1–280 characters after trim) and at most one project.
   - Add from one input at the top of `/todos`: Enter submits, the input clears and keeps focus. The project
     defaults to the active filter.
   - Pending todos are listed oldest first.
   - Checking a todo moves it to Completed immediately (optimistic); if the request fails it returns to its
     place and an error is shown.
   - Edit title and project in a dialog, which also offers Delete with a second press to confirm.
2. Completed
   - Completed todos sit in a collapsed "Completed (N)" section, most recently completed first, respecting
     the active filter.
   - They stay stored until deleted by hand. Unchecking returns one to pending.
3. Projects and filter
   - Project names are unique ignoring case (1–50 characters after trim). A duplicate returns `409`.
   - Filter chips: All, each project, and No project, each with its pending count.
   - The filter lives in the URL: `/todos?project=<uuid>` or `/todos?project=none`. An unknown or malformed
     value behaves as All.
   - Projects are created, renamed and deleted from `/todos`. Deleting one asks for confirmation and moves
     its todos to No project; no todo is deleted.
4. Home
   - "Pending tasks" shows the 5 oldest pending todos with their project name, tickable in place, plus
     "View all (N)" linking to `/todos`. Empty state: "Nothing pending".
5. Security and data flow
   - Every Route Handler calls `requireSession()`; Server Components call `requirePageSession()`.
   - Lists render behind `<Suspense>` with skeletons, so the page frame stays instant.
   - Mutations go through the API, then `router.refresh()`.
   - All controls are keyboard reachable and labelled; checkboxes have touch targets of at least 44px.

## API

| Method and path             | Body or query                                  | Success                             |
| --------------------------- | ---------------------------------------------- | ----------------------------------- |
| `GET /api/todos`            | `?project=<uuid>\|none`                        | `200 { items: Todo[] }`             |
| `POST /api/todos`           | `{ title, projectId? }`                        | `201 Todo`                          |
| `PATCH /api/todos/[id]`     | `{ title?, projectId?, completed? }` (min one) | `200 Todo`, `404` if unknown        |
| `DELETE /api/todos/[id]`    | —                                              | `204`, `404` if unknown             |
| `GET /api/projects`         | —                                              | `200 { items: ProjectWithCount[] }` |
| `POST /api/projects`        | `{ name }`                                     | `201 Project`, `409` on duplicate   |
| `PATCH /api/projects/[id]`  | `{ name }`                                     | `200 Project`, `404`, `409`         |
| `DELETE /api/projects/[id]` | —                                              | `204`, `404` if unknown             |

`projectId` may be `null`. A `projectId` that does not exist returns `400`. A malformed `id` returns `404`.
`lib/api.ts` gains the error code `conflict` (409).

## Data model

```ts
// features/todos/schema.ts
export const projects = dailyTab.table(
  'projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex('projects_name_lower_idx').on(sql`lower(${t.name})`)]
);

export const todos = dailyTab.table(
  'todos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    projectId: uuid('project_id').references(() => projects.id, {
      onDelete: 'set null',
    }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index('todos_completed_at_created_at_idx').on(t.completedAt, t.createdAt),
    index('todos_project_id_idx').on(t.projectId),
  ]
);
```

Deleting a project relies on `ON DELETE SET NULL`, so no todo can be lost or left pointing at nothing.

## Project Structure

```
features/todos/
  schema.ts                     projects, todos
  validation.ts                 Zod bodies, parseProjectFilter
  dal.ts                        todos and projects queries (server-only)
  components/
    todos-view.tsx              async Server Component: filter + lists for /todos
    pending-section.tsx         async Server Component for Home
    project-filter.tsx          chips (links)
    project-manager.tsx         client: create, rename, delete
    add-todo-form.tsx           client
    todo-list.tsx, todo-row.tsx client: optimistic toggle
    todo-dialog.tsx             client: edit, delete
    todos-skeleton.tsx          Suspense fallbacks
app/api/todos/route.ts, [id]/route.ts
app/api/projects/route.ts, [id]/route.ts
app/(app)/todos/page.tsx        replaces the placeholder
```

Reuses `requirePageSession()` and the dialog component added by `shortcuts`.

## Commands

`pnpm dev | build | lint | typecheck | test`, `pnpm db:generate`, `pnpm db:migrate`.
Cloud migration: `DATABASE_URL_MIGRATE='…' pnpm db:migrate` (owner runs it).

## Testing Strategy

- **Unit:** Zod bodies (trim, length, at least one field), `parseProjectFilter`.
- **Integration (test DB):** ordering, filter (project, none, unknown), completing and uncompleting, pending
  counts, limit of 5 for Home, duplicate names in any case → `409`, deleting a project keeps its todos with
  `projectId = null`, Route Handlers for 200/201/204/400/404/409 and 401 without a session.
- **HTTP smoke:** full flow with a session cookie against `next start`.
- **Browser E2E:** still deferred. The owner checks by hand at the checkpoint.

## Boundaries

- **Always:** tables in `daily_tab`; `requireSession()` in every handler; validate `projectId` exists.
- **Ask first:** new dependencies; running the cloud migration.
- **Never:** delete todos as a side effect of deleting a project; put project names or titles in logs.

## Success Criteria

- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` pass.
- [ ] Without a session, every `/api/todos*` and `/api/projects*` route returns 401.
- [ ] Deleting a project leaves its todos under No project.
- [ ] Creating "Work" when "work" exists returns 409.
- [ ] `/todos?project=none` shows only todos without a project; `/todos?project=garbage` shows All.
- [ ] Home shows at most 5 pending todos, oldest first, and "View all (N)" has the true total.
- [ ] Ticking a todo on Home removes it from the list without a full page reload.
- [ ] Owner: add, tick, untick, edit, delete, filter and manage projects at desktop and mobile width.
- [ ] Deployed: the same flow works on https://daily-tab.vercel.app and the Android PWA.

## Not Doing (and why)

- **Due dates, priority, notes, subtasks, reminders:** owner chose title + project only.
- **Manual ordering of todos:** oldest first is predictable; add it only if it proves necessary.
- **Automatic cleanup of completed todos:** owner chose to keep them until deleted by hand.
- **Reading tasks from Obsidian:** todos are managed entirely in Supabase (owner decision).
- **Offline writes:** not part of this module.
