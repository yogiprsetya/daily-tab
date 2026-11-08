# Spec: platform

Status: **Done 2026-11-08**: deployed at https://daily-tab.vercel.app
Module id: `platform` (see [CAPABILITY-MAP.md](CAPABILITY-MAP.md)) · Depends on: —

## Objective

Provide the foundation every feature module plugs into: a deployed Next.js app on Vercel with a working
Drizzle connection to Supabase Postgres (all tables in `pgSchema('daily_tab')`), a migration pipeline,
an API convention, a responsive full-viewport app shell with navigation to one route per feature module,
a dark-only theme, and an installable PWA.

The platform ships **no feature tables and no auth**. When it is done, the app shows the shell with
placeholder pages for each module, `GET /api/health` proves the database round-trip, and the app installs
on Android from Chrome.

User: one person (the owner), on Chrome desktop (later via `newtab-extension`) and Android (installed PWA).

### Acceptance criteria

1. Database
   - `db/schema.ts` exports `dailyTab = pgSchema('daily_tab')`; every module table is declared with
     `dailyTab.table(...)`.
   - `pnpm db:migrate` creates schema `daily_tab`, and Drizzle's migration journal table lives inside
     `daily_tab` (not `public` / `drizzle`).
   - drizzle-kit only introspects/diffs `daily_tab` (`schemaFilter`), so other schemas in the shared local
     Supabase instance are never touched.
2. API convention
   - `GET /api/health` returns `200 {"status":"ok","db":"ok"}` after a `select 1`, and
     `503 {"status":"error","db":"unreachable"}` when the database cannot be reached.
   - Shared helpers exist for JSON success/error responses and Zod body/query validation (see Code Style).
3. Layout
   - Modules are **separate routes**, not crammed into one page: `/` (home), `/todos`, `/bookmarks`,
     `/reading-list`, `/obsidian`. Each renders a placeholder until its module lands.
   - The shell fills the viewport with no document scroll in either axis (`h-dvh`, `w-full`,
     `overflow-hidden`; `100vw` is avoided because it overflows when a scrollbar is present). The page
     content area scrolls internally; the navigation never scrolls away.
   - **≥1024px:** persistent left navigation rail (icon + label) with the 5 destinations.
   - **<1024px:** bottom tab bar with the same 5 destinations (≥44px tap targets, respects
     `env(safe-area-inset-bottom)`).
   - Active destination is indicated visually and with `aria-current="page"`.
   - **Home `/`** shows: today's day and date (owned by `platform`), shortcut links (slot filled by
     `shortcuts`), and pending tasks (slot filled by `todos`). Date and day use the device's local time zone
     and update after midnight without a reload. Until those modules land, their slots show placeholders.
4. Theme
   - Dark only: `<html class="dark">` set in the root layout, shadcn dark tokens, no light theme, no toggle.
     Manifest `theme_color` / `background_color` match the dark background.
5. PWA
   - `app/manifest.ts` with `name: "Daily Tab"`, `short_name`, `display: "standalone"`, `start_url: "/"`,
     dark theme/background colors, icons 192/512 + maskable 512.
   - Chrome Android offers "Install app"; the installed app opens standalone with the right name and icon.
   - No service worker in this module (installability does not require one; offline is out of scope).
6. Hygiene
   - Root metadata title "Daily Tab"; boilerplate removed (`app/page.tsx` demo, unused Geist fonts,
     `public/*.svg` from create-next-app, README replaced with project-specific setup).
   - Env vars validated by `lib/env.ts` (`getEnv()`, parsed once on first use by the DB client); a missing or
     malformed `DATABASE_URL` fails with a message naming the variable, never its value.

## Tech Stack

Existing: Next.js 16.4.5 (App Router, `cacheComponents: true`, `partialPrefetching: true`), React 19.3,
TypeScript 5 strict, Tailwind CSS 4, shadcn (`base-lyra` style, Base UI), lucide-react, ESLint 9, Prettier,
husky + lint-staged.

To add (**requires approval**):

| Package       | Kind | Why                                                                    |
| ------------- | ---- | ---------------------------------------------------------------------- |
| `drizzle-orm` | dep  | ORM / query builder                                                    |
| `postgres`    | dep  | postgres.js driver (works with Supabase pooler using `prepare: false`) |
| `zod`         | dep  | env + API input validation                                             |
| `server-only` | dep  | build-time guard so DB code never reaches a client bundle              |
| `drizzle-kit` | dev  | migration generate/apply                                               |
| `vitest`      | dev  | unit + integration tests                                               |

Infrastructure:

- **Local:** the shared local Supabase stack already running in Docker (Postgres on `127.0.0.1:54322`).
  `daily_tab` schema isolates this app from other projects in that instance.
- **Prod:** Supabase cloud project + Vercel Hobby. Runtime uses the transaction pooler (`:6543`);
  migrations use the session pooler / direct connection.

## Commands

```bash
pnpm dev            # next dev
pnpm build          # next build
pnpm lint           # eslint
pnpm typecheck      # next typegen && tsc --noEmit         (new)
pnpm format:check   # prettier --check .
pnpm test               # vitest run                            (new)
pnpm test:watch     # vitest                                (new)
pnpm db:generate    # drizzle-kit generate  -> drizzle/*.sql (new)
pnpm db:migrate     # drizzle-kit migrate   (uses DATABASE_URL_MIGRATE ?? DATABASE_URL) (new)
pnpm db:studio      # drizzle-kit studio                    (new)
```

## Environment variables

| Name                   | Where                       | Purpose                                                  |
| ---------------------- | --------------------------- | -------------------------------------------------------- |
| `DATABASE_URL`         | local, Vercel               | Runtime connection (prod: transaction pooler `:6543`)    |
| `DATABASE_URL_MIGRATE` | local (optional), CI/manual | Migration connection (prod: session pooler or direct)    |
| `TEST_DATABASE_URL`    | local                       | Separate database `daily_tab_test` on the local instance |

A committed `.env.example` lists names only. `.env` stays gitignored (already is).

## Project Structure

```
app/
  layout.tsx              root layout: <html class="dark">, metadata, fonts
  manifest.ts             PWA manifest
  (app)/                  route group sharing the app shell
    layout.tsx            renders <AppShell> (nav rail / bottom tabs + scrollable content area)
    page.tsx              home "/"
    todos/page.tsx        placeholder until `todos`
    bookmarks/page.tsx    placeholder until `bookmarks`
    reading-list/page.tsx placeholder until `reading-list`
    obsidian/page.tsx     placeholder until `obsidian`
  api/
    health/route.ts       GET /api/health
    <module>/...          each feature module owns its route handlers
components/
  ui/                     shadcn primitives (generated, edited only via shadcn CLI or deliberately)
  shell/                  app-shell.tsx, nav-items.ts, nav-rail.tsx, bottom-tab-bar.tsx, module-placeholder.tsx
  home/                   today.tsx (platform-owned day + date on `/`)
  inline-script.tsx       pre-paint script helper (Next docs: preventing-flash-before-hydration)
db/
  index.ts                Drizzle client (server-only)
  schema.ts               export const dailyTab = pgSchema('daily_tab'); re-exports module tables
features/
  <module>/               one folder per capability-map module id
    schema.ts             dailyTab.table(...) definitions
    dal.ts                data access functions (server-only), the ONLY place that queries the DB
    validation.ts         Zod schemas shared by route handlers and forms
    components/           module UI (panel content)
    *.test.ts             tests colocated with the code they test
lib/
  env.ts                  Zod-validated process.env
  api.ts                  json(), apiError(), parseBody(), parseQuery()
  utils.ts                cn() (existing)
drizzle/                  generated SQL migrations + meta (committed)
public/icons/             PWA icons: icon.svg + icon-maskable.svg (sources) and rendered PNGs
tests/global-setup.ts     migrates the test database before Vitest runs
drizzle.config.ts
vitest.config.mts
```

## Architecture decisions

- **Single data path per operation.** `features/<module>/dal.ts` holds all queries. Server Components read
  through the DAL directly. **All mutations go through Route Handlers** (`app/api/<module>`), which the UI
  calls with `fetch` followed by `router.refresh()`. The same endpoints serve the Chrome extension and any
  other client, which is what "api" in the stack means. No Server Actions, to avoid two wrappers per mutation.
- **No `supabase-js`.** Supabase is used as Postgres only. `daily_tab` is never added to PostgREST's exposed
  schemas, so the anon key cannot reach app data.
- **Cache Components.** DB reads are request-time data and sit behind `<Suspense>` inside each page, so the
  app shell (navigation, page chrome) is the prerendered static shell. Per-module caching is decided in
  each module's spec.
- **Connection reuse.** One `postgres()` client per server instance (cached on `globalThis` in dev to survive
  HMR), `prepare: false` for pooler compatibility, small `max` pool.

## Code Style

Prettier config is the source of truth (single quotes, semicolons, 2 spaces, trailing commas es5, Tailwind
class sorting). Files and folders are kebab-case; React components are PascalCase; DB columns are snake_case
in SQL and camelCase in TypeScript.

```ts
// db/schema.ts
import { pgSchema } from 'drizzle-orm/pg-core';

export const dailyTab = pgSchema('daily_tab');
```

```ts
// db/index.ts
import 'server-only';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { getEnv } from '@/lib/env';

const globalForDb = globalThis as unknown as { sql?: postgres.Sql };

// `prepare: false` is required by Supabase's transaction pooler.
const sql =
  globalForDb.sql ??
  postgres(getEnv().DATABASE_URL, { prepare: false, max: 5 });
if (process.env.NODE_ENV !== 'production') globalForDb.sql = sql;

export const db = drizzle(sql);
```

```ts
// app/api/health/route.ts
import { sql } from 'drizzle-orm';
import { connection } from 'next/server';
import { db } from '@/db';
import { json } from '@/lib/api';

export async function GET() {
  // With Cache Components a GET handler can be prerendered; force request time.
  await connection();

  try {
    await db.execute(sql`select 1`);
    return json({ status: 'ok', db: 'ok' });
  } catch {
    return json({ status: 'error', db: 'unreachable' }, { status: 503 });
  }
}
```

API response shape for every module:

```ts
// success: the resource or { items: T[] }
// error:   { error: { code: 'validation_error' | 'not_found' | 'unauthorized' | 'internal', message: string, issues?: ZodIssue[] } }
```

## Testing Strategy

- **Vitest** (per `node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md`), tests colocated as
  `*.test.ts`.
- **Unit:** `lib/api.ts` helpers, `lib/env.ts` validation.
- **Integration:** DAL and Route Handlers run against `TEST_DATABASE_URL` (database `daily_tab_test` on the
  local instance), migrated before the suite and truncated between tests. Never against the dev database.
- **Platform-level checks** (manual, recorded in the PR): layout no-scroll at 1440×900 and 412×915 in
  DevTools, Android install on a real device.
- Playwright is **not** added here; it is proposed in the first module that has interactive UI flows.
- Coverage: no numeric gate for `platform`; every exported helper in `lib/` has tests.

## Boundaries

- **Always:** keep every table in `dailyTab`; put DB access only in `db/` and `features/*/dal.ts` with
  `import 'server-only'`; validate every request body/query with Zod at the route handler; run
  `pnpm lint && pnpm typecheck && pnpm test` before committing; read the relevant guide in
  `node_modules/next/dist/docs/` before using a Next.js API (e.g. `proxy.ts`, not `middleware.ts`).
- **Ask first:** adding any dependency not in the table above; applying migrations to the Supabase cloud
  project; changing `next.config.ts`; changing Vercel project settings; editing generated `components/ui/*`
  beyond shadcn CLI output.
- **Never:** commit `.env` or any secret; use `drizzle-kit push` against the cloud database; create objects
  outside `daily_tab`; use `supabase-js` or the anon key for app data; truncate or drop anything in the dev
  database from tests.

## Success Criteria

- [x] `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test` all pass.
- [x] `pnpm db:migrate` on a fresh database creates schema `daily_tab` with the migration journal inside it
      (`select table_schema, table_name from information_schema.tables where table_schema = 'daily_tab'`).
- [x] `curl localhost:3000/api/health` → `200 {"status":"ok","db":"ok"}`; with an unreachable `DATABASE_URL` → `503`.
- [x] At 1440×900: nav rail visible; each of the 5 destinations navigates to its route;
      `document.documentElement.scrollHeight === innerHeight` and no horizontal overflow, even when page
      content is taller than the viewport (content area scrolls instead).
- [x] At 412×915: bottom tab bar visible, nav rail hidden; same 5 destinations work; no document scroll.
- [x] The app renders in dark theme regardless of the OS color scheme.
- [x] Chrome reports no manifest errors and no installability errors (`Page.getInstallabilityErrors`).
- [x] On Android the app installs from the deployed URL and launches standalone as "Daily Tab".
- [x] Deployed to Vercel with `/api/health` returning 200 against the Supabase cloud project.

## Open Questions

Resolved 2026-11-08:

- Home `/` = day + date, shortcut links, pending tasks (see Layout).
- Icons: generate a simple mark (no existing logo).
- Supabase: connection lives in `.env`; all objects stay in `pgSchema('daily_tab')`. The cloud connection
  string for Vercel is confirmed in Task 9.
