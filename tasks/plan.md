# Implementation Plan: newtab-extension

Spec: [SPEC-newtab-extension.md](../SPEC-newtab-extension.md) · Map: [CAPABILITY-MAP.md](../CAPABILITY-MAP.md) · Tasks: [todo.md](todo.md)
Previous modules: [archive/](archive/)

## Overview

A Manifest V3 extension, loaded unpacked, that shows the deployed app in an iframe on New Tab and saves the current page
to the reading list from a toolbar button. The app needs three small changes: a framing policy, tiles that replace the
whole tab, and one route opened to the extension's origin. There is no migration.

## Architecture Decisions

- **Prove the risky part first.** Task 1 is the smallest extension that can answer the cookie questions. The app sends no
  framing header yet, so this needs no app change and costs little if the answer is no.
- **Pure logic apart from Chrome APIs.** `save.js` turns a tab into a request and a status into a badge, so it runs under
  Vitest. `background.js` and `newtab.js` stay thin and are checked by hand.
- **No build step.** Plain JS modules loaded directly; `allowJs` lets the tests import them.
- **One predicate for the CSRF exception.** `isAllowedMutation` in `features/auth/request.ts` holds the whole rule, so it
  is testable and `proxy.ts` barely changes. The extension origin is a constant: the id is public and fixed by the
  manifest key.
- **Health check runs beside the iframe.** A cross-origin iframe fires `load` even on an error page, so a parallel `fetch`
  of `/api/health` detects a network failure without delaying the normal case.

## Task List

### Before starting

- [x] Owner approves this plan
- [x] `feat/reading-list` merged, migration `0006` run on the cloud database, reading list live in production
- [x] Branch `feat/newtab-extension` from `master`

### Feasibility

- [x] Task 1: Extension shell with the app in an iframe

### Checkpoint A: Feasibility gate (owner)

- [x] Cookie reaches the frame and the service worker, or the redirect fallback is applied and the spec updated

### App changes

- [x] Task 2: Allow only the extension to frame the app
- [x] Task 3: Shortcut tiles replace the whole tab
- [x] Task 4: Accept the extension origin on `POST /api/reading-items`

### Checkpoint B: App changes live (human-gated)

- [ ] Gates and HTTP smoke pass; app changes deployed; the frame still loads with the policy in place

### Finish the extension

- [ ] Task 5: Dark wrapper and unreachable message
- [ ] Task 6: Request body and badge logic
- [ ] Task 7: Toolbar button saves the current page

### Checkpoint C: Works end to end (owner)

- [ ] Gates pass; owner runs every criterion in the spec

- [ ] Task 8: Install notes in the README
- [ ] Task 9: Release (human-gated)

## Risks and Mitigations

| Risk                                                       | Impact | Mitigation                                                                          |
| ---------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------- |
| Chrome withholds the `SameSite=Lax` cookie from the iframe | High   | Task 1 tests it first; agreed fallback is a redirect                                |
| Third-party cookie settings block the frame's cookie       | Med    | Checked in Task 1 with the owner's real Chrome profile                              |
| `frame-ancestors` rejects the `chrome-extension:` source   | Med    | Checked at Checkpoint B; reverting the header commit restores the frame             |
| The CSRF exception reaches too far                         | High   | Exact origin, one method, one path; unit tests on every other combination           |
| Extension id changes, breaking the policy and the origin   | Med    | Fixed `key` in the manifest before the id is used in the app                        |
| Tiles navigate inside the frame and sites refuse to load   | Med    | `target="_top"` in Task 3; owner checks with a site that refuses framing            |
| No browser tool available to the build agent               | Med    | Checkpoints A–C are owner steps; everything else is covered by tests and HTTP smoke |

## Parallelization

Tasks 2–4 are independent of each other, but all need the extension id from Task 1. Tasks 5 and 6 are independent. Run
sequentially: the set is small and the checkpoints are the slow part.
