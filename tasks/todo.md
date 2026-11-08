# Tasks: platform

Plan: [plan.md](plan.md) · Spec: [SPEC-platform.md](../SPEC-platform.md)

Standing verification for every task: `npm run lint && npm run typecheck && npm test && npm run build`
(the last three exist from Task 1 onward). Read the relevant guide in `node_modules/next/dist/docs/` before
using any Next.js API.

## Phase 1: Data foundation

- [x] **Task 1: Tooling, env validation, test runner**
  - Description: Install approved deps (`drizzle-orm`, `postgres`, `zod`, `server-only`; dev `drizzle-kit`,
    `vitest`). Add `typecheck`, `test`, `test:watch` scripts. Add `lib/env.ts` that parses `process.env`
    with Zod (`DATABASE_URL` required, `DATABASE_URL_MIGRATE` and `TEST_DATABASE_URL` optional) and throws a
    readable error listing missing vars. Add `.env.example` with names only.
  - Acceptance:
    - [x] `npm test` runs Vitest; `lib/env.test.ts` covers valid env, missing `DATABASE_URL`, invalid URL.
    - [x] `npm run typecheck` passes.
    - [x] `.env.example` is committed, `.env` is still ignored.
  - Verify: `npm test`, `npm run typecheck`, `git check-ignore .env`
  - Dependencies: none
  - Files: `package.json`, `vitest.config.mts`, `lib/env.ts`, `lib/env.test.ts`, `.env.example`
  - Scope: M

- [x] **Task 2: Drizzle connection and `daily_tab` migration pipeline**
  - Description: `db/schema.ts` exports `dailyTab = pgSchema('daily_tab')`. `db/index.ts` creates the
    server-only postgres.js client (`prepare: false`, `max: 5`, `globalThis` reuse in dev) and the Drizzle
    instance. `drizzle.config.ts` uses `schemaFilter: ['daily_tab']`, `migrations: { schema: 'daily_tab' }`,
    out dir `drizzle/`, and `DATABASE_URL_MIGRATE ?? DATABASE_URL`. Add `db:generate`, `db:migrate`,
    `db:studio` scripts. Generate the initial migration that creates the schema (custom migration if
    drizzle-kit emits nothing for a table-less schema).
  - Acceptance:
    - [x] `npm run db:migrate` against local Supabase creates schema `daily_tab` containing the migration
          journal table, and no other schema gains objects.
    - [x] Re-running `npm run db:migrate` is a no-op.
    - [x] Importing `@/db` from a Client Component fails the build (`server-only`).
  - Verify: `npm run db:migrate` twice; then
    `select table_schema, table_name from information_schema.tables where table_schema = 'daily_tab';`
  - Dependencies: Task 1
  - Files: `db/schema.ts`, `db/index.ts`, `drizzle.config.ts`, `package.json`, `drizzle/0000_*.sql`
  - Scope: M

- [x] **Task 3: API helpers and `GET /api/health`**
  - Description: `lib/api.ts` provides `json(data, init?)`, `apiError(code, message, issues?)` (status derived from code),
    `parseBody(request, zodSchema)`, `parseQuery(url, zodSchema)` returning the error shape from the spec.
    `app/api/health/route.ts` runs `select 1` and returns 200/503. Vitest global setup migrates the
    `daily_tab_test` database; test env points `DATABASE_URL` at `TEST_DATABASE_URL`.
  - Acceptance:
    - [x] Unit tests for every helper, including Zod failure → 400 `validation_error` with `issues`.
    - [x] Integration test: health handler returns `200 {"status":"ok","db":"ok"}` against the test DB.
    - [x] Manual: `curl localhost:3000/api/health` → 200; with an unreachable `DATABASE_URL` → 503 (the shared local Postgres is never stopped).
  - Verify: `npm test`, `npm run dev` + curl
  - Dependencies: Task 2
  - Files: `lib/api.ts`, `lib/api.test.ts`, `app/api/health/route.ts`, `app/api/health/route.test.ts`,
    `tests/global-setup.ts`
  - Scope: M
  - Note: one-time manual step to create the test database, e.g.
    `docker exec supabase_db_supabase createdb -U postgres daily_tab_test` (ask before running).

## Checkpoint A: Data foundation

- [x] `npm run lint && npm run typecheck && npm test && npm run build` pass
- [x] Health endpoint 200 / 503 confirmed manually
- [ ] Human review before UI work

## Phase 2: App shell

- [x] **Task 4: Dark theme and root layout cleanup**
  - Description: Root layout sets `<html lang="en" class="dark">`, metadata title "Daily Tab", keeps a
    single sans font (Inter) and Geist Mono only if used, `body` is `h-dvh overflow-hidden bg-background
text-foreground`. Remove create-next-app demo (`app/page.tsx`) and `public/{file,globe,next,vercel,window}.svg`.
  - Acceptance:
    - [x] App renders dark with OS set to light.
    - [x] Tab title is "Daily Tab".
    - [x] No references remain to removed files.
  - Verify: `npm run build`; DevTools "Emulate prefers-color-scheme: light" still shows dark
  - Dependencies: none (can run in parallel with Phase 1)
  - Files: `app/layout.tsx`, `app/globals.css`, `app/page.tsx` (deleted), `public/*.svg` (deleted)
  - Scope: S

- [x] **Task 5: App shell with navigation and home route**
  - Description: `nav-items.ts` lists the 5 destinations (Home `/`, Todos, Bookmarks, Reading list,
    Obsidian) with lucide icons. `nav-rail.tsx` (≥1024px) and `bottom-tab-bar.tsx` (<1024px) render that list
    with `next/link`, active state via `usePathname` + `aria-current="page"`. `app-shell.tsx` lays out nav +
    an internally scrolling content area. `app/(app)/layout.tsx` uses it; `app/(app)/page.tsx` is home:
    today's day + date (client-rendered in local time zone, rolls over at midnight) plus placeholder slots
    for "Shortcuts" and "Pending tasks".
  - Acceptance:
    - [x] Home shows the correct local day and date, weekday ("Sunday") above the date ("8 November 2026").
    - [x] At 1440×900 the rail is visible and the tab bar hidden; at 412×915 the reverse.
    - [x] Tab bar items are ≥44px tall and clear `env(safe-area-inset-bottom)`.
    - [x] Long placeholder content scrolls inside the content area; `document.documentElement.scrollHeight
=== innerHeight`, no horizontal overflow.
  - Verify: `npm run build` (no Cache Components errors); DevTools device toolbar at both sizes
  - Dependencies: Task 4
  - Files: `components/shell/nav-items.ts`, `components/shell/nav-rail.tsx`,
    `components/shell/bottom-tab-bar.tsx`, `components/shell/app-shell.tsx`, `app/(app)/layout.tsx`,
    `app/(app)/page.tsx`
  - Also added: `components/home/today.tsx` (+ test), `components/inline-script.tsx`, `components/shell/nav-items.test.ts`, and `module-placeholder.tsx` (moved up from Task 6 because home uses it).
  - Scope: M

- [x] **Task 6: Placeholder routes for the four other modules**
  - Description: Static pages `/todos`, `/bookmarks`, `/reading-list`, `/obsidian`, each rendering a shared
    `ModulePlaceholder` (module name + "Coming soon").
  - Acceptance:
    - [x] All 5 destinations navigate without 404 from both rail and tab bar.
    - [x] Active item matches the current route on each page.
  - Verify: `npm run build` shows the 4 routes as static; manual click-through at both viewport sizes
  - Dependencies: Task 5
  - Files: `components/shell/module-placeholder.tsx`, `app/(app)/todos/page.tsx`,
    `app/(app)/bookmarks/page.tsx`, `app/(app)/reading-list/page.tsx`, `app/(app)/obsidian/page.tsx`
  - Scope: M

## Checkpoint B: App shell

- [x] No document scroll at 1440×900 and 412×915; all destinations work
- [ ] Human review of look and feel

## Phase 3: Ship

- [x] **Task 7: PWA manifest and icons**
  - Description: `app/manifest.ts` per spec (name, short_name, standalone, `start_url: "/"`, dark
    theme/background colors). Icons 192, 512 and maskable 512 in `public/icons/` (source depends on the
    icon open question).
  - Acceptance:
    - [x] `/manifest.webmanifest` serves the manifest.
    - [x] DevTools > Application > Manifest shows no errors or installability warnings.
  - Verify: `npm run build && npm start`, DevTools Application panel
  - Dependencies: Task 4
  - Files: `app/manifest.ts`, `public/icons/icon-192.png`, `public/icons/icon-512.png`,
    `public/icons/icon-maskable-512.png`
  - Scope: S

- [ ] **Task 8: README and setup docs**
  - Description: Replace create-next-app README with: what the app is, local setup (shared local Supabase,
    `.env` from `.env.example`, create `daily_tab_test`, `npm run db:migrate`), all scripts, deploy notes,
    link to CAPABILITY-MAP and specs.
  - Acceptance:
    - [ ] Following the README from a fresh clone reaches a running app with `/api/health` 200.
    - Pending: walk through it from a fresh clone once the branch is committed.
  - Verify: walk through the steps in a clean worktree
  - Dependencies: Tasks 1–7
  - Files: `README.md`
  - Scope: XS

- [ ] **Task 9: Deploy to Vercel + Supabase cloud (human-gated)**
  - Description: With explicit approval: confirm/create the Supabase cloud project, run
    `npm run db:migrate` with `DATABASE_URL_MIGRATE` set to the session pooler, set `DATABASE_URL`
    (transaction pooler `:6543`) in Vercel, deploy.
  - Acceptance:
    - [ ] Deployed `/api/health` → 200.
    - [ ] App installs on Android from the deployed URL and launches standalone as "Daily Tab".
  - Verify: curl the deployed URL; install on the Android device
  - Dependencies: Tasks 1–8
  - Files: none in repo (Vercel/Supabase settings)
  - Scope: S

## Checkpoint C: Platform complete

- [ ] Every Success Criteria box in SPEC-platform.md is checked
- [ ] Ready for `SPEC-auth`
