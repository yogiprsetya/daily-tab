# Implementation Plan: auth (done 2026-11-08)

Spec: [SPEC-auth.md](../../SPEC-auth.md) · Map: [CAPABILITY-MAP.md](../../CAPABILITY-MAP.md) · Tasks: [auth-todo.md](auth-todo.md)
Previous module: [platform-plan.md](platform-plan.md)

## Overview

Put the whole app behind a static email + PIN login. A `jose`-signed cookie (30 days, sliding) carries the
session; `proxy.ts` redirects pages and returns 401 for APIs without it, rejects cross-origin mutations,
and refreshes old sessions. Login attempts go to `daily_tab.login_attempts` for per-IP and global rate
limits. Every non-public Route Handler also calls `requireSession()`. First, the repo switches from npm to
pnpm.

## Architecture Decisions

- **Primitives before wiring.** Session, credential and request helpers are pure and unit-tested first
  (Tasks 1–2). The DB-backed rate limiter (Task 3) and the route handlers (Task 4) build on them.
- **Login page before the proxy.** The proxy redirects everything to `/login`; shipping it before the page
  exists would leave the app unusable between tasks. Order: routes → page → proxy → logout UI.
- **Auth env parsed separately** (`features/auth/config.ts`), so `drizzle-kit` and DB tooling never need
  `AUTH_*`.
- **No DB in the proxy.** It only verifies the JWT (fast, runs on every request). Rate limiting lives in the
  login handler.
- **No browser E2E** for now (owner decision). HTTP-level smoke with curl plus a manual browser check at
  the checkpoints.

## Task List

### Phase 0: Tooling

- [x] Task 0: Switch from npm to pnpm

### Phase 1: Auth core

- [x] Task 1: Auth config and session primitives
- [x] Task 2: Credential check, request helpers, new API error codes
- [x] Task 3: `login_attempts` table and rate limiter
- [x] Task 4: Login and logout route handlers

### Checkpoint A: API auth works

- [x] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` pass
- [x] curl: login sets a correct `dt_session` cookie; wrong PIN 401; 6th failure 429; logout clears

### Phase 2: Gate and UI

- [x] Task 5: Login page
- [x] Task 6: Proxy (redirect, 401, Origin check, sliding refresh)
- [x] Task 7: Logout button

### Checkpoint B: Locked locally

- [x] All local Success Criteria in SPEC-auth.md checked
- [x] Owner checks login, wrong PIN, `next` redirect, logout in a browser (desktop + mobile width)

### Phase 3: Ship

- [x] Task 8: Docs (README, .env.example)
- [x] Task 9: Deploy with `AUTH_*` on Vercel and cloud migration (human-gated)

### Checkpoint C: Auth complete

- [x] Deployed Success Criteria checked; Android PWA logs in and stays logged in

## Risks and Mitigations

| Risk                                                                               | Impact | Mitigation                                                                                     |
| ---------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------- |
| Proxy matcher blocks static assets or the manifest, breaking install/icons         | High   | Test the matcher with `unstable_doesProxyMatch`; curl assets without a session                 |
| Proxy forgets a route; data leaks                                                  | High   | `requireSession()` in every non-public handler (defense in depth); proxy unit tests per branch |
| Sliding refresh sets a cookie on every request, or desyncs JWT `exp` and `Max-Age` | Med    | Refresh only when token is > 24 h old; one helper builds both token and cookie                 |
| `Origin` absent on legitimate same-origin requests                                 | Med    | Browsers send `Origin` on POST/PUT/PATCH/DELETE `fetch`; test that the login form passes       |
| `x-forwarded-for` spoofing bypasses per-IP limit                                   | Med    | Global limit (20/60 min) caps total guesses regardless of IP                                   |
| Global limit lets an attacker block the owner's new logins                         | Low    | Accepted: existing 30-day sliding sessions keep working                                        |
| pnpm switch changes resolved versions                                              | Med    | Use the existing `pnpm-lock.yaml`; run full gates + build right after switching                |
| Login page or form reads the session and breaks Cache Components static shell      | Low    | `/login` stays static; the redirect-when-logged-in lives in the proxy                          |

## Open Questions

None blocking. Vercel `AUTH_*` values are set by the owner in Task 9.
