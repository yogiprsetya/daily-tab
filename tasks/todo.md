# Tasks: newtab-extension

Plan: [plan.md](plan.md) · Spec: [SPEC-newtab-extension.md](../SPEC-newtab-extension.md)

Standing verification for every task that changes code: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`. Write
tests first where logic can run outside a browser.

## Before starting

- [x] Owner approves this plan
- [x] `feat/reading-list` merged, migration `0006` run on the cloud database, reading list live in production
- [x] Branch `feat/newtab-extension` from `master`

## Feasibility

- [x] **Task 1: Extension shell with the app in an iframe**
  - Description: `manifest.json` with a fixed `key`, `newtab.html` and `newtab.js` showing the deployed app full-viewport,
    icons from `public/icons`. No app changes.
  - Acceptance:
    - [x] The extension id is the same after removing and re-adding it; no private key is in the repo.
    - [x] A new tab shows Home signed in, and signing in from inside the frame survives a browser restart.
    - [x] A `fetch` to `/api/reading-topics` from the service worker console returns `200`, which shows the cookie is sent.
  - Verify: owner, in their real Chrome profile; `pnpm test extension` checks the shipped files hold no key material
  - Dependencies: reading list live in production
  - Files: `extension/manifest.json`, `newtab.html`, `newtab.js`, `icons/*`
  - Scope: S

## Checkpoint A: Feasibility gate (owner)

- [x] Cookie reaches the frame and the service worker, or the redirect fallback is applied and the spec updated

## App changes

- [x] **Task 2: Allow only the extension to frame the app**
  - Description: `EXTENSION_ORIGIN` in `features/auth/request.ts`, and `headers()` in `next.config.ts` sending
    `frame-ancestors` with that origin on all routes.
  - Acceptance:
    - [x] The policy names only the extension origin and applies to every route.
    - [x] `/` and `/reading-list` stay partially static in `pnpm build`.
  - Verify: `pnpm test next.config`; HTTP smoke reads the header from a page
  - Dependencies: Task 1
  - Files: `next.config.ts`, `next.config.test.ts`, `features/auth/request.ts`
  - Scope: S

- [x] **Task 3: Shortcut tiles replace the whole tab**
  - Description: `target="_top"` on the tile link. In a normal tab and the PWA this behaves as today.
  - Acceptance:
    - [ ] Inside the frame, a tile replaces the whole tab, including for a site that refuses framing.
    - [ ] Ctrl/Cmd+click and middle-click still open a new tab.
  - Verify: `pnpm test features/shortcuts`; owner check at Checkpoint C
  - Dependencies: Task 1
  - Files: `features/shortcuts/components/shortcut-grid.tsx`
  - Scope: XS

- [ ] **Task 4: Accept the extension origin on `POST /api/reading-items`**
  - Description: `isAllowedMutation(method, pathname, headers, appOrigin)`, used by `proxy.ts`. Auth change, approved in
    the spec for exactly this route.
  - Acceptance:
    - [ ] Same origin passes on every route, as today.
    - [ ] The extension origin passes only for `POST /api/reading-items`; `PATCH`, `DELETE` and other paths return `403`.
    - [ ] A foreign or missing origin returns `403`; without a session the allowed route still returns `401`.
  - Verify: `pnpm test features/auth proxy`; HTTP smoke with the extension origin
  - Dependencies: Task 2
  - Files: `features/auth/request.ts`, `request.test.ts`, `proxy.ts`, `proxy.test.ts`
  - Scope: S

## Checkpoint B: App changes live (human-gated)

- [ ] Gates and HTTP smoke pass
- [ ] Owner deploys the app changes
- [ ] The frame still loads with the policy in place, and a cross-site page cannot frame the app

## Finish the extension

- [ ] **Task 5: Dark wrapper and unreachable message**
  - Description: the wrapper page follows `prefers-color-scheme` before the app paints. A `fetch` of `/api/health` beside
    the iframe swaps in "Can't reach Daily Tab" and Retry on a network failure.
  - Acceptance:
    - [ ] No white flash in dark mode; the tab title is "New Tab".
    - [ ] Offline shows the message, Retry recovers once back online, and a `503` from the app does not show it.
  - Verify: owner, using DevTools offline mode
  - Dependencies: Task 1
  - Files: `extension/newtab.html`, `newtab.js`
  - Scope: S

- [ ] **Task 6: Request body and badge logic**
  - Description: `save.js`, pure functions from a tab to a request body and from a status to a badge and tooltip.
  - Acceptance:
    - [ ] The title is trimmed and cut to 120 characters; an empty title falls back to the hostname.
    - [ ] A page that is not http or https produces no request.
    - [ ] Every row of the spec's badge table is covered.
  - Verify: `pnpm test extension`
  - Dependencies: none
  - Files: `extension/save.js`, `save.test.ts`
  - Scope: S

- [ ] **Task 7: Toolbar button saves the current page**
  - Description: `background.js` on `chrome.action.onClicked`: builds the body, calls the API with credentials, sets the
    badge and tooltip for that tab.
  - Acceptance:
    - [ ] A saved page appears on `/reading-list` under No topic.
    - [ ] Each badge result appears on the right tab and clears on navigation.
    - [ ] Permissions are exactly `activeTab` and the one host.
  - Verify: owner, at Checkpoint C
  - Dependencies: Tasks 4, 6, Checkpoint B
  - Files: `extension/background.js`, `manifest.json`
  - Scope: S

## Checkpoint C: Works end to end (owner)

- [ ] Gates pass
- [ ] Owner runs every owner item in the spec's Success Criteria

- [ ] **Task 8: Install notes in the README**
  - Acceptance:
    - [ ] Load unpacked, reload after changes, and what breaks if the manifest key changes are documented.
  - Dependencies: Checkpoint C
  - Files: `README.md`
  - Scope: XS

- [ ] **Task 9: Release (human-gated)**
  - Acceptance:
    - [ ] Branch merged and deployed; the extension is loaded from the merged code.
    - [ ] A new tab and a save both work against production.
  - Dependencies: Task 8
  - Scope: XS
