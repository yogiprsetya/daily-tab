# Spec: auth

Status: **Done 2026-11-08**: live at https://daily-tab.vercel.app
Module id: `auth` (see [CAPABILITY-MAP.md](CAPABILITY-MAP.md)) · Depends on: `platform`

## Objective

Lock the whole app behind a single static identity (email + PIN from env vars) so that only the owner can
see or change data on the public URL https://daily-tab.vercel.app. Logging in should be rare: a session
lasts 30 days and is extended every time the app is used. Guessing the PIN must be impractical even though
the URL is public.

Every later feature module relies on this: its pages are protected by the proxy, and its Route Handlers
call `requireSession()`.

### Acceptance criteria

1. Login
   - `/login` shows an email field and a numeric PIN field (`inputMode="numeric"`,
     `autocomplete="username"` / `"current-password"` so password managers work).
   - Correct email + PIN sets the session cookie and navigates to the `next` path (default `/`).
   - Wrong email or PIN shows one generic message ("Email or PIN is incorrect"); the response never says
     which field was wrong.
   - Visiting `/login` with a valid session redirects to `/`.
   - `next` only accepts same-origin relative paths (`/…`, not `//…` or absolute URLs).
2. Session
   - Stateless signed cookie: HS256 JWT via `jose`, payload `{ sub: 'owner' }` + `iat`/`exp`, no PII.
   - Cookie `dt_session`: `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, `Max-Age` 30 days.
   - Sliding expiry: when a valid session is more than 24 h old, the proxy issues a fresh token (new `exp`
     = now + 30 days). The JWT `exp` and the cookie `Max-Age` always move together.
   - Expired, tampered, or wrong-secret tokens are treated as no session.
   - Rotating `AUTH_SECRET` logs out every device.
3. Protection (proxy + defense in depth)
   - `proxy.ts` runs on every route except static assets (`/_next/static`, `/_next/image`, `/icons/*`,
     `/manifest.webmanifest`, `/favicon.ico`, `/robots.txt`).
   - Public routes: `/login`, `POST /api/auth/login`, `GET /api/health`.
   - No valid session on a page → `307` redirect to `/login?next=<original path + query>`.
   - No valid session on `/api/*` → `401 {"error":{"code":"unauthorized",…}}`, never a redirect.
   - Every non-public Route Handler also calls `requireSession()` and returns 401 on failure, so a proxy
     misconfiguration cannot expose data.
4. CSRF
   - For `POST`/`PUT`/`PATCH`/`DELETE` to `/api/*` (including login and logout), the proxy rejects requests
     whose `Origin` header is missing or differs from the app's origin with
     `403 {"error":{"code":"forbidden",…}}`.
5. Brute-force protection
   - Every login attempt is recorded in `daily_tab.login_attempts` (ip, succeeded, created_at).
   - Per IP: 5 failures within 15 minutes → `429` with `Retry-After` until the oldest of those failures
     leaves the window.
   - Global: 20 failures within 60 minutes (any IP) → `429` for everyone until failures age out. Existing
     sessions keep working; only new logins are blocked.
   - While limited, credentials are not even compared, and the blocked attempt is not recorded.
   - Rows older than 24 h are deleted opportunistically on each attempt.
   - Client IP: first entry of `x-forwarded-for`, else `x-real-ip`, else `"unknown"`.
6. Logout
   - `POST /api/auth/logout` clears the cookie (`Max-Age=0`) and returns `200`; the client then goes to
     `/login`.
   - Logout button: bottom of the nav rail (≥1024px) and in the Home header (<1024px).
7. Credentials
   - `AUTH_EMAIL` (valid email, compared case-insensitively after trim), `AUTH_PIN` (digits only, at least
     6), `AUTH_SECRET` (at least 32 characters). Missing or invalid values fail with a message naming the
     variable, never its value.
   - Email and PIN are compared in constant time (SHA-256 both sides, then `timingSafeEqual`).
   - The PIN is stored as-is in env, not hashed: a 6-digit PIN has 10⁶ values, so a hash is cracked
     instantly offline and adds no real protection. The rate limits are the protection.

## Tech Stack

Builds on `platform`. Package manager: **pnpm** (switch from npm happens first, see plan).

To add (**requires approval**, implied by the session decision): `jose` (JWT sign/verify, works in the
Node.js runtime the proxy uses by default).

## Commands

```bash
pnpm dev | pnpm build | pnpm lint | pnpm typecheck | pnpm test
pnpm db:generate       # adds the login_attempts migration
pnpm db:migrate        # local; cloud via DATABASE_URL_MIGRATE='…' pnpm db:migrate (owner runs it)
openssl rand -base64 32  # generate AUTH_SECRET
```

## Environment variables (new)

| Name          | Where         | Purpose                                          |
| ------------- | ------------- | ------------------------------------------------ |
| `AUTH_EMAIL`  | local, Vercel | The only accepted login email                    |
| `AUTH_PIN`    | local, Vercel | The only accepted PIN (≥ 6 digits)               |
| `AUTH_SECRET` | local, Vercel | HS256 signing key (≥ 32 chars); rotate to revoke |

Tests use fixed fake values from `vitest.config.mts`, never the real ones. Auth vars are parsed by
`features/auth/config.ts` (lazily), not by `lib/env.ts`, so `drizzle-kit` keeps working without them.

## Project Structure

```
proxy.ts                          optimistic gate: assets excluded, redirect / 401 / 403, sliding refresh
app/
  login/
    page.tsx                      static page, outside the (app) shell
    login-form.tsx                client form → POST /api/auth/login
  api/auth/
    login/route.ts                POST: validate, rate limit, compare, set cookie
    logout/route.ts               POST: clear cookie
features/auth/
  config.ts                       Zod-parsed AUTH_* vars (server-only, lazy)
  session.ts                      signSession, verifySession, needsRefresh, cookie builders (pure: proxy uses it)
  require-session.ts              requireSession() for Route Handlers (server-only, reads cookies())
  credentials.ts                  constant-time email + PIN check
  rate-limit.ts                   DAL over login_attempts (server-only)
  schema.ts                       dailyTab.table('login_attempts', …)
  request.ts                      clientIp(), safeNextPath(), isSameOrigin()
  *.test.ts
components/shell/
  logout-button.tsx               client button used by the rail and the Home header
lib/api.ts                        + error codes `forbidden` (403), `rate_limited` (429)
```

## Data model

```ts
// features/auth/schema.ts
export const loginAttempts = dailyTab.table(
  'login_attempts',
  {
    id: bigint('id', { mode: 'number' })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    ip: text('ip').notNull(),
    succeeded: boolean('succeeded').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index('login_attempts_created_at_idx').on(t.createdAt),
    index('login_attempts_ip_created_at_idx').on(t.ip, t.createdAt),
  ]
);
```

## Code Style

Same conventions as `platform`. Auth-specific example (the contract every module's handlers follow):

```ts
// app/api/<module>/route.ts
import { requireSession } from '@/features/auth/require-session';

export async function GET() {
  const session = await requireSession();
  if (!session.ok) return session.response; // 401 JSON
  // … DAL call
}
```

## Testing Strategy

- **Unit (Vitest):** sign/verify (valid, expired, tampered, wrong secret), `needsRefresh` at the 24 h edge,
  credential compare (right/wrong/case/whitespace), `safeNextPath`, `clientIp`, `isSameOrigin`, config
  validation messages.
- **Proxy:** call `proxy(new NextRequest(…))` for each branch (asset passthrough via
  `unstable_doesMiddlewareMatch` (the name actually exported by Next 16.4.5; the docs say `unstable_doesProxyMatch`), page redirect with `next`, API 401, bad Origin 403, valid session passes,
  old session gets a refreshed `Set-Cookie`, `/login` with session → `/`). Utilities from
  `next/experimental/testing/server`.
- **Integration (test DB):** rate limiter windows (per-IP 5/15 min, global 20/60 min, ageing out),
  login handler (success sets cookie and records; failure 401 and records; limited 429 with `Retry-After`
  and no record), logout clears cookie.
- **HTTP smoke (curl, recorded in the task notes):** redirects, 401/403/429, `Set-Cookie` attributes, login →
  cookie → protected page 200, logout.
- **Browser E2E: deferred** (owner decision 2026-11-08). The owner checks login, wrong PIN, `next`
  redirect and logout by hand at the checkpoint. Playwright can be proposed again in a later module.
- **Prod smoke after deploy:** `/` → 307 `/login`; `/api/health` 200; wrong PIN → 401; login works on the
  installed Android app.

## Boundaries

- **Always:** keep `AUTH_*` values out of logs, errors, responses and test fixtures; call `requireSession()`
  in every non-public Route Handler; keep the proxy free of DB access; keep the login error generic.
- **Ask first:** setting or rotating `AUTH_*` on Vercel; running the cloud migration; adding any dependency
  beyond `jose`; adding public routes.
- **Never:** put PII or the PIN in the JWT; log request bodies of `/api/auth/*`; disable the Origin check
  or rate limits "temporarily"; issue tokens without an expiry.

## Success Criteria

- [x] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` pass.
- [x] Local: unauthenticated `/`, `/todos` → 307 `/login?next=…`; `/api/health` → 200;
      `/manifest.webmanifest` and `/icons/icon-192.png` → 200 without a session.
- [x] Local: login with the right email + PIN reaches `next`; wrong PIN shows the generic message.
- [x] 6th failed attempt from one IP within 15 min → 429 with `Retry-After`; correct PIN is also refused
      while limited.
- [x] `POST /api/auth/login` with `Origin: https://evil.example` → 403.
- [x] A session older than 24 h gets a new cookie on the next request; a 31-day-old token is rejected.
- [x] Logout clears the cookie and lands on `/login`.
- [x] Deployed: same checks against https://daily-tab.vercel.app; Android PWA can log in and stays logged
      in after closing and reopening.

## Not Doing (and why)

- **API tokens for external clients:** no client needs one yet; `newtab-extension` decides how it
  authenticates.
- **Per-device logout / session list:** chose stateless sessions; rotating `AUTH_SECRET` logs out all.
- **2FA, PIN reset flow, multi-user:** single owner; changing the PIN = change env + redeploy.
- **Hashing the PIN in env:** see Acceptance 7.

## Open Questions

Resolved 2026-11-08: logout placement as specified; browser E2E deferred (no Playwright yet).
