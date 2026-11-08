# Tasks: auth

Plan: [plan.md](plan.md) · Spec: [SPEC-auth.md](../SPEC-auth.md)

Standing verification for every task: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`. Read the
relevant guide in `node_modules/next/dist/docs/` before using a Next.js API. Never print `AUTH_*` values.

## Phase 0: Tooling

- [x] **Task 0: Switch from npm to pnpm**
  - Description: Track `pnpm-lock.yaml`, delete `package-lock.json`, resolve the `allowBuilds` placeholder
    in `pnpm-workspace.yaml`, change the husky hook to `pnpm exec lint-staged`, replace `npm` with `pnpm` in
    README and specs' command sections.
  - Acceptance:
    - [x] `pnpm install --frozen-lockfile` succeeds with no prompts.
    - [x] Full gates and build pass under pnpm.
    - [x] A commit runs lint-staged through pnpm.
  - Verify: `pnpm install --frozen-lockfile && pnpm lint && pnpm typecheck && pnpm test && pnpm build`
  - Dependencies: none
  - Files: `package-lock.json` (deleted), `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `.husky/pre-commit`,
    `README.md`
  - Scope: S

## Phase 1: Auth core

- [x] **Task 1: Auth config and session primitives**
  - Description: Add `jose`. `features/auth/config.ts` parses `AUTH_EMAIL`, `AUTH_PIN` (digits, ≥6),
    `AUTH_SECRET` (≥32 chars) lazily, errors name variables only. `features/auth/session.ts`:
    `signSession(now)`, `verifySession(token, now)`, `needsRefresh(payload, now)` (> 24 h),
    `sessionCookie(token)` / `clearedSessionCookie()` (one place for name + attributes + 30-day Max-Age),
    `requireSession()` reading `cookies()` and returning `{ ok, response }` like `parseBody`. Test values
    for `AUTH_*` in `vitest.config.mts` env.
  - Acceptance:
    - [x] Unit tests: valid token verifies; expired, tampered, wrong-secret and garbage tokens → null.
    - [x] JWT `exp` and cookie `Max-Age` are both 30 days from the same `now`.
    - [x] `needsRefresh` false at 23 h 59 m, true at 24 h 1 m.
    - [x] Config errors name the variable and never contain its value.
  - Verify: `pnpm test features/auth`
  - Dependencies: Task 0
  - Files: `package.json`, `pnpm-lock.yaml`, `features/auth/config.ts`, `features/auth/session.ts`,
    `features/auth/session.test.ts`, `vitest.config.mts` (+ `config.test.ts`)
  - Note: `requireSession` lives in `features/auth/require-session.ts` (server-only, uses `cookies()`) so `session.ts` stays importable from `proxy.ts`.
  - Scope: M

- [x] **Task 2: Credential check, request helpers, new API error codes**
  - Description: `credentials.ts`: `checkCredentials(email, pin)` with trim + case-insensitive email,
    SHA-256 + `timingSafeEqual` for both. `request.ts`: `clientIp(headers)`, `safeNextPath(value)`,
    `isSameOrigin(request)`. `lib/api.ts`: add `forbidden` (403) and `rate_limited` (429).
  - Acceptance:
    - [x] Credentials: right pair true; wrong email, wrong PIN, empty, different length → false;
          `" Owner@X.com "` matches `owner@x.com`.
    - [x] `safeNextPath` keeps `/todos?x=1`; rejects `//evil.com`, `https://evil.com`, `/\evil`, empty → `/`.
    - [x] `clientIp` takes the first `x-forwarded-for` entry, falls back to `x-real-ip`, then `"unknown"`.
    - [x] `isSameOrigin` false for missing or foreign `Origin`.
  - Verify: `pnpm test features/auth lib`
  - Dependencies: Task 1
  - Files: `features/auth/credentials.ts`, `features/auth/request.ts`, their tests, `lib/api.ts`,
    `lib/api.test.ts`
  - Scope: M

- [x] **Task 3: `login_attempts` table and rate limiter**
  - Description: `features/auth/schema.ts` per spec, migration via `pnpm db:generate`, applied locally.
    `rate-limit.ts` (server-only): `checkLoginAllowed(ip, now)` → `{ allowed: true } | { allowed: false,
retryAfterSeconds }` (per-IP 5/15 min first, then global 20/60 min), `recordAttempt(ip, succeeded,
now)`, `pruneAttempts(now)` (> 24 h). Integration tests truncate `login_attempts` between tests.
  - Acceptance:
    - [x] 4 failures from an IP allowed, 5th failure → next check blocked; `retryAfterSeconds` matches the
          oldest failure + 15 min.
    - [x] Failures older than the window do not count; successes never count.
    - [x] 20 failures spread over many IPs block every IP.
    - [x] Migration only touches `daily_tab`.
  - Verify: `pnpm test features/auth/rate-limit`; `pnpm db:migrate`; check `information_schema`
  - Dependencies: Task 1
  - Files: `features/auth/schema.ts`, `features/auth/rate-limit.ts`, `features/auth/rate-limit.test.ts`,
    `drizzle/0001_*.sql`, `db/schema.ts` (re-export if needed)
  - Scope: M

- [x] **Task 4: Login and logout route handlers**
  - Description: `POST /api/auth/login`: Zod body `{ email, pin }` → rate limit check (429 + `Retry-After`,
    no record) → `checkCredentials` → record → 401 `invalid_credentials`-style generic message, or 200 with
    `Set-Cookie`. `POST /api/auth/logout`: cleared cookie, 200. Both `await connection()`.
  - Acceptance:
    - [x] Integration: success → 200 + cookie with correct attributes + success recorded.
    - [x] Wrong PIN → 401 generic message + failure recorded; 6th from the same IP → 429 with
          `Retry-After`, nothing recorded, even with the right PIN.
    - [x] Invalid body → 400 `validation_error` without echoing the PIN.
    - [x] Logout → `Max-Age=0` cookie.
  - Verify: `pnpm test app/api/auth`; curl locally
  - Dependencies: Tasks 2, 3
  - Files: `app/api/auth/login/route.ts`, `app/api/auth/login/route.test.ts`,
    `app/api/auth/logout/route.ts`, `app/api/auth/logout/route.test.ts`
  - Scope: M

## Checkpoint A: API auth works

- [x] Gates pass
- [x] curl: login cookie, 401, 429, logout recorded below

## Phase 2: Gate and UI

- [x] **Task 5: Login page**
  - Description: `app/login/page.tsx` (static, outside `(app)`, dark, centered card) + `login-form.tsx`
    (client): email + PIN fields with correct `autocomplete`/`inputMode`, submit → `fetch` login → on 200
    `router.replace(safeNextPath(next))`; shows generic error or "Too many attempts, try again in N
    minutes"; disables while submitting; focuses the first field.
  - Acceptance:
    - [x] `/login` builds as static.
    - [x] Errors are announced (`role="alert"`), fields have labels, PIN never echoed in UI state beyond the
          input.
    - [ ] Manual (owner): login works and lands on `next`.
  - Verify: `pnpm build` route table; manual browser check
  - Dependencies: Task 4
  - Files: `app/login/page.tsx`, `app/login/login-form.tsx`
  - Scope: S

- [x] **Task 6: Proxy**
  - Description: `proxy.ts` with matcher excluding assets; public routes; Origin check for mutating `/api/*`;
    page → 307 `/login?next=…`; API → 401 JSON; `/login` with session → `/`; valid session older than 24 h →
    `NextResponse.next()` with a refreshed cookie.
  - Acceptance:
    - [x] Unit tests for every branch with `NextRequest` and `next/experimental/testing/server`.
    - [x] `unstable_doesMiddlewareMatch` (the docs name `unstable_doesProxyMatch` is not exported in 16.4.5) false for `/_next/static/x.js`, `/icons/icon-192.png`,
          `/manifest.webmanifest`; true for `/`, `/todos`, `/api/health`.
    - [x] curl without cookie: `/` 307, `/api/health` 200, icons/manifest 200.
  - Verify: `pnpm test proxy`; `pnpm build && pnpm start` + curl
  - Dependencies: Tasks 1, 2, 5
  - Files: `proxy.ts`, `proxy.test.ts`
  - Scope: M

- [x] **Task 7: Logout button**
  - Description: `components/shell/logout-button.tsx` (client): `POST /api/auth/logout` then
    `router.replace('/login')`. Rendered at the bottom of the nav rail and in the Home header below 1024px.
  - Acceptance:
    - [x] Visible on desktop rail and mobile Home only; keyboard reachable with a visible label.
    - [ ] Manual (owner): logout lands on `/login`; back button does not show protected content.
  - Verify: `pnpm build`; manual browser check
  - Dependencies: Task 6
  - Files: `components/shell/logout-button.tsx`, `components/shell/nav-rail.tsx`, `app/(app)/page.tsx`
  - Scope: S

## Checkpoint B: Locked locally

- [ ] Local Success Criteria in SPEC-auth.md checked
- [ ] Owner's manual browser check (desktop + mobile width)

## Phase 3: Ship

- [x] **Task 8: Docs**
  - Description: README: auth env vars, generating `AUTH_SECRET`, how to revoke all sessions, rate-limit
    behaviour; `.env.example` gains `AUTH_*` names.
  - Acceptance:
    - [x] A new reader can set up auth locally from the README alone.
  - Verify: read-through; `pnpm format:check`
  - Dependencies: Tasks 1–7
  - Files: `README.md`, `.env.example`
  - Scope: XS

- [ ] **Task 9: Deploy (human-gated)**
  - Description: Owner sets `AUTH_EMAIL`, `AUTH_PIN`, `AUTH_SECRET` on Vercel, runs `scripts/sql/2026-11-08-move-migration-journal.sql` once in the Supabase SQL editor (journal moves to `drizzle.daily_tab_migration`), then runs the cloud migration
    (`DATABASE_URL_MIGRATE='…' pnpm db:migrate`); PR merged; prod smoke by Claude (curl) and owner
    (Android).
  - Acceptance:
    - [ ] Prod: `/` 307 `/login`; `/api/health` 200; wrong PIN 401; foreign Origin 403.
    - [ ] Android PWA logs in and is still logged in after closing and reopening.
  - Dependencies: Tasks 0–8
  - Files: none in repo
  - Scope: S

## Checkpoint C: Auth complete

- [ ] Every Success Criteria box in SPEC-auth.md checked
- [ ] Ready for the next module
