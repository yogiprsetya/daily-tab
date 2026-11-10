# Daily Tab

A personal, single-user dashboard: Chrome New Tab on desktop, installed PWA on Android. It holds shortcuts,
todos (filtered by project), bookmarks, a reading list, and a read-only view of an Obsidian vault.

- What is built, module by module: [CAPABILITY-MAP.md](CAPABILITY-MAP.md)
- Specs: `SPEC-<module>.md` at the repo root (start with [SPEC-platform.md](SPEC-platform.md))
- Current plan and tasks: [tasks/plan.md](tasks/plan.md), [tasks/todo.md](tasks/todo.md)

Stack: Next.js 16 (App Router, Cache Components), React 19, Tailwind CSS 4, shadcn (Base UI), Drizzle ORM +
postgres.js on Supabase Postgres, Zod, Vitest.

## Local setup

Requirements: Node 24, pnpm, Docker, and a running local Supabase stack (Postgres on `127.0.0.1:54322`). The stack
can be shared with other projects: this app keeps every object in the `daily_tab` schema.

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Create `.env` from the template and fill it in:

   ```bash
   cp .env.example .env
   ```

   - `DATABASE_URL`: `postgresql://postgres:postgres@127.0.0.1:54322/postgres` for the default local stack.
   - `TEST_DATABASE_URL`: same server, database `daily_tab_test`. It must differ from `DATABASE_URL`; the test
     config refuses to run otherwise.
   - `AUTH_EMAIL`, `AUTH_PIN` (digits only, at least 6), `AUTH_SECRET` (generate with
     `openssl rand -base64 32`). See [Authentication](#authentication). Tests use their own fake values.

3. Create the test database once:

   ```bash
   docker exec supabase_db_supabase createdb -U postgres daily_tab_test
   ```

4. Apply migrations to the dev database (tests migrate their own database automatically):

   ```bash
   pnpm db:migrate
   ```

5. Start the app and check the database round-trip:

   ```bash
   pnpm dev
   curl localhost:3000/api/health   # {"status":"ok","db":"ok"}
   ```

   Then open http://localhost:3000 and sign in with `AUTH_EMAIL` and `AUTH_PIN`.

## Scripts

| Command            | What it does                                                             |
| ------------------ | ------------------------------------------------------------------------ |
| `pnpm dev`         | Next.js dev server                                                       |
| `pnpm build`       | Production build                                                         |
| `pnpm start`       | Serve the production build                                               |
| `pnpm lint`        | ESLint                                                                   |
| `pnpm typecheck`   | `next typegen` (route types) then `tsc --noEmit`; works before any build |
| `pnpm format`      | Prettier write (`format:check` to verify only)                           |
| `pnpm test`        | Vitest, once (`test:watch` for watch mode); needs `TEST_DATABASE_URL`    |
| `pnpm db:generate` | Generate a SQL migration from `db/schema.ts` + `features/*/schema.ts`    |
| `pnpm db:migrate`  | Apply migrations (uses `DATABASE_URL_MIGRATE`, else `DATABASE_URL`)      |
| `pnpm db:studio`   | Drizzle Studio                                                           |

Before committing: `pnpm lint && pnpm typecheck && pnpm test`. The pre-commit hook only runs
lint-staged (ESLint + Prettier on staged files).

## Database rules

- Declare tables with `dailyTab.table(...)` from [db/schema.ts](db/schema.ts). Nothing goes in `public`.
- drizzle-kit is limited to the `daily_tab` schema (`schemaFilter`). Its migration journal is
  `drizzle.daily_tab_migration`, next to other projects' journals such as `drizzle.lontu_migrations`. This
  is the only object outside `daily_tab`.
- A database migrated before 2026-11-08 still has the journal at `daily_tab.__drizzle_migrations`. Run
  [scripts/sql/2026-11-08-move-migration-journal.sql](scripts/sql/2026-11-08-move-migration-journal.sql)
  on it once (e.g. in the Supabase SQL editor) before the next `pnpm db:migrate`.
- Query the database only from `db/` and `features/<module>/dal.ts` (both `server-only`).
- Never run `drizzle-kit push` against the cloud database.

## Authentication

Single owner, static credentials from env. Spec: [SPEC-auth.md](SPEC-auth.md).

- **Session:** a signed JWT in the `dt_session` cookie (HttpOnly, Secure, SameSite=Lax), valid 30 days and
  renewed automatically once it is more than a day old. Opening the app at least once a month keeps you
  signed in.
- **Log out everywhere:** set a new `AUTH_SECRET` and redeploy. Changing `AUTH_PIN` alone does not end
  existing sessions.
- **Brute-force limits:** 5 failed logins per IP within 15 minutes, and 20 failed logins in total within
  60 minutes, block new logins until the oldest failure ages out. Sessions that already exist keep
  working. Attempts are stored in `daily_tab.login_attempts` and pruned after 24 hours.
- **What is public:** `/login`, `POST /api/auth/login`, `GET /api/health`, the manifest, icons and static
  assets. Everything else needs a session: pages redirect to `/login?next=…`, API routes return 401.
- **Writing a new API route:** call `requireSession()` from
  [features/auth/require-session.ts](features/auth/require-session.ts) first, even though `proxy.ts`
  already checks. Mutating requests (`POST`/`PUT`/`PATCH`/`DELETE`) must come from the app's own origin. The
  one exception is the Chrome extension's `POST /api/reading-items` (see below).

## Shortcuts

Shown on Home; "Edit" switches to rows with move, edit and delete. Spec: [SPEC-shortcuts.md](SPEC-shortcuts.md).

- URLs must be `http` or `https`; a bare domain gets `https://`.
- Icons come from `icons.duckduckgo.com`, which receives only the hostname. The title's first letter shows
  until the icon has loaded, or if it never does.

## Todos

`/todos` lists todos with a project filter in the URL (`?project=<id>` or `?project=none`). Spec:
[SPEC-todos.md](SPEC-todos.md).

- A todo has a title, an optional project, link and notes. Links follow the same rules as shortcuts.
- Deleting a project keeps its todos; they move to No project.
- Completed todos stay in the collapsed Completed section until deleted by hand.
- Home shows the 5 oldest pending todos.

## Chrome extension

[extension/](extension/) shows the deployed app on every new tab, in a full-page frame, and adds a toolbar
button that saves the current page to the reading list. Spec:
[SPEC-newtab-extension.md](SPEC-newtab-extension.md).

- **Install:** open `chrome://extensions`, turn on Developer mode, choose **Load unpacked** and select
  `extension/`. On Windows with WSL, load it straight from `\\wsl.localhost\<distro>\…\daily-tab\extension`;
  a copy on a Windows drive goes stale. Keep the New Tab change when Chrome asks, and pin the button from the
  puzzle-piece menu.
- **After changing a file:** press reload on the extension's card. Chrome keeps running the old version until
  then.
- **Saving:** one click saves the tab's title and URL, with No topic and no note. The badge shows ✓ for saved
  or already saved, and ! for signed out, a page that can't be saved, or a failed request; it clears when the
  tab loads a new page. Chrome's "can't read or change site data" label is expected: with `activeTab`, the
  extension only gets access to a tab when you click its button.
- **The id is fixed by `key` in `extension/manifest.json`** (`jfockggajegdlihmoaildfbifdlonidp`). The app
  trusts that id in two places: `frame-ancestors` in [next.config.ts](next.config.ts) and the CSRF exception in
  [features/auth/request.ts](features/auth/request.ts). A changed or removed key gives a new id, so the New
  Tab frame is refused and saves return 403; a test fails when `EXTENSION_ORIGIN` and the key disagree. The
  private key was not kept, and unpacked installs don't need it.
- **App URL:** production only, set in `extension/config.js`. It must match `host_permissions` in the
  manifest.

## PWA icons

Sources are [public/icons/icon.svg](public/icons/icon.svg) (rounded, purpose `any`) and
[public/icons/icon-maskable.svg](public/icons/icon-maskable.svg) (full bleed, purpose `maskable`). After
editing them, re-render the PNGs with headless Chrome, for example:

```bash
render() { # <source> <size> <output.png>
  sed "s/viewBox=/width=\"$2\" height=\"$2\" viewBox=/" "public/icons/$1.svg" > "/tmp/$1-$2.svg"
  google-chrome --headless=new --disable-gpu --hide-scrollbars --default-background-color=00000000 \
    --window-size="$2,$2" --screenshot="$3" "file:///tmp/$1-$2.svg"
}
render icon 192 public/icons/icon-192.png
render icon 512 public/icons/icon-512.png
render icon-maskable 512 public/icons/icon-maskable-512.png
```

## Deploy (Vercel + Supabase cloud)

1. Apply migrations to the cloud project from your machine, using the session pooler (port 5432) or the
   direct connection:

   ```bash
   DATABASE_URL_MIGRATE='postgresql://…:5432/postgres' pnpm db:migrate
   ```

2. In Vercel, set `DATABASE_URL` to the **transaction pooler** (port 6543). The client already uses
   `prepare: false`, which that pooler requires. Also set `AUTH_EMAIL`, `AUTH_PIN` and `AUTH_SECRET`;
   without them every request fails, because the proxy cannot verify sessions.
3. Deploy, then check `https://<deployment>/api/health`.
4. On Android, open the deployed URL in Chrome and choose "Install app".

Vercel Hobby runs cron jobs at most once a day; keep that in mind for scheduled work in later modules.
