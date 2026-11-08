# Daily Tab

A personal, single-user dashboard: Chrome New Tab on desktop, installed PWA on Android. It holds shortcuts,
todos (filtered by project), bookmarks, a reading list, and a read-only view of an Obsidian vault.

- What is built, module by module: [CAPABILITY-MAP.md](CAPABILITY-MAP.md)
- Specs: `SPEC-<module>.md` at the repo root (start with [SPEC-platform.md](SPEC-platform.md))
- Current plan and tasks: [tasks/plan.md](tasks/plan.md), [tasks/todo.md](tasks/todo.md)

Stack: Next.js 16 (App Router, Cache Components), React 19, Tailwind CSS 4, shadcn (Base UI), Drizzle ORM +
postgres.js on Supabase Postgres, Zod, Vitest.

## Local setup

Requirements: Node 24, Docker, and a running local Supabase stack (Postgres on `127.0.0.1:54322`). The stack
can be shared with other projects: this app keeps every object in the `daily_tab` schema.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env` from the template and fill it in:

   ```bash
   cp .env.example .env
   ```

   - `DATABASE_URL`: `postgresql://postgres:postgres@127.0.0.1:54322/postgres` for the default local stack.
   - `TEST_DATABASE_URL`: same server, database `daily_tab_test`. It must differ from `DATABASE_URL`; the test
     config refuses to run otherwise.

3. Create the test database once:

   ```bash
   docker exec supabase_db_supabase createdb -U postgres daily_tab_test
   ```

4. Apply migrations to the dev database (tests migrate their own database automatically):

   ```bash
   npm run db:migrate
   ```

5. Start the app and check the database round-trip:

   ```bash
   npm run dev
   curl localhost:3000/api/health   # {"status":"ok","db":"ok"}
   ```

## Scripts

| Command               | What it does                                                          |
| --------------------- | --------------------------------------------------------------------- |
| `npm run dev`         | Next.js dev server                                                    |
| `npm run build`       | Production build                                                      |
| `npm start`           | Serve the production build                                            |
| `npm run lint`        | ESLint                                                                |
| `npm run typecheck`   | `tsc --noEmit`                                                        |
| `npm run format`      | Prettier write (`format:check` to verify only)                        |
| `npm test`            | Vitest, once (`test:watch` for watch mode); needs `TEST_DATABASE_URL` |
| `npm run db:generate` | Generate a SQL migration from `db/schema.ts` + `features/*/schema.ts` |
| `npm run db:migrate`  | Apply migrations (uses `DATABASE_URL_MIGRATE`, else `DATABASE_URL`)   |
| `npm run db:studio`   | Drizzle Studio                                                        |

Before committing: `npm run lint && npm run typecheck && npm test`. The pre-commit hook only runs
lint-staged (ESLint + Prettier on staged files).

## Database rules

- Declare tables with `dailyTab.table(...)` from [db/schema.ts](db/schema.ts). Nothing goes in `public`.
- drizzle-kit is limited to the `daily_tab` schema (`schemaFilter`), and its migration journal lives in
  `daily_tab.__drizzle_migrations`.
- Query the database only from `db/` and `features/<module>/dal.ts` (both `server-only`).
- Never run `drizzle-kit push` against the cloud database.

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
   DATABASE_URL_MIGRATE='postgresql://…:5432/postgres' npm run db:migrate
   ```

2. In Vercel, set `DATABASE_URL` to the **transaction pooler** (port 6543). The client already uses
   `prepare: false`, which that pooler requires.
3. Deploy, then check `https://<deployment>/api/health`.
4. On Android, open the deployed URL in Chrome and choose "Install app".

Vercel Hobby runs cron jobs at most once a day; keep that in mind for scheduled work in later modules.
