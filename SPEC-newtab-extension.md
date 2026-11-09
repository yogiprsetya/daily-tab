# Spec: newtab-extension

Status: **Approved 2026-11-09**
Module id: `newtab-extension` (see [CAPABILITY-MAP.md](CAPABILITY-MAP.md)) · Depends on: `auth`, `reading-list`

## Objective

Make every new Chrome tab on desktop open Daily Tab with a live session, while the address bar stays ready for typing.
A toolbar button saves the current page to the reading list. The extension is installed unpacked, by the owner only,
and always talks to https://daily-tab.vercel.app.

### Feasibility gate

The design rests on browser behaviour that has not been tested here, so Task 1 proves it against the deployed app
before anything else is built:

| Must hold                                                                                   | If it does not                                                                             |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| The `SameSite=Lax` session cookie reaches an iframe inside the extension page, and is saved | New Tab redirects to the app instead (owner's agreed fallback); acceptance 1–3 are revised |
| `frame-ancestors chrome-extension://<id>` allows that iframe                                | Same fallback                                                                              |
| The service worker's `fetch` sends the cookie, with the extension id as `Origin`            | Stop and ask; `SameSite=Lax` is not relaxed without a decision                             |

### Acceptance criteria

1. New Tab
   - A new tab shows the deployed app in a full-viewport iframe, with no scrollbars or margins added by the wrapper.
   - The address bar is empty and focused, so typing searches straight away. The tab title is "New Tab".
   - In dark mode the wrapper page is dark before the app paints, so there is no white flash.
   - Signed out, the frame shows the login page. Signing in there lands on Home and survives closing the browser.
   - If the app cannot be reached, the tab shows "Can't reach Daily Tab" and a Retry button. The check runs alongside
     the iframe load, so it adds no delay when the app is up.
2. Links inside the frame
   - A shortcut tile replaces the whole tab rather than the frame. Ctrl/Cmd+click and middle-click still open a new
     tab, and tiles behave as before in a normal browser tab and the Android PWA.
   - Links that already open in a new tab are unchanged.
3. Framing
   - Every app page sends `Content-Security-Policy: frame-ancestors chrome-extension://<id>`. No other site can frame
     the app; today nothing prevents it.
4. Save to reading list
   - Clicking the toolbar button saves the active tab with one click: its title and URL, No topic, no note.
   - The title is trimmed and cut to 120 characters. An empty title falls back to the hostname.
   - The result shows as a badge and tooltip on that tab, and clears when the tab navigates:

     | Result                       | Badge | Tooltip                      |
     | ---------------------------- | ----- | ---------------------------- |
     | `201`                        | `✓`   | Saved to reading list        |
     | `409`                        | `✓`   | Already on your reading list |
     | `401`                        | `!`   | Sign in to Daily Tab first   |
     | `400`, or not http/https     | `!`   | This page can't be saved     |
     | Anything else, network error | `!`   | Could not save. Try again.   |

   - A page that is not http or https is rejected in the extension, without a request.

5. Security
   - Permissions are `activeTab` plus the single host `https://daily-tab.vercel.app/*`. No `tabs`, `cookies` or
     `storage`, and no content scripts.
   - `proxy.ts` accepts the extension's exact origin for `POST /api/reading-items` only. Every other mutating route
     keeps the same-origin check and returns `403` for that origin.
   - The cookie stays `HttpOnly`, `Secure`, `SameSite=Lax`. `requireSession()` is unchanged. No API tokens and no CORS
     headers: host permission lets the extension's request through.
   - The extension id is fixed by a public `key` in the manifest. The private key is not committed.

## App changes

| File                                              | Change                                                                        |
| ------------------------------------------------- | ----------------------------------------------------------------------------- |
| `features/auth/request.ts`                        | `EXTENSION_ORIGIN` and `isAllowedMutation(method, pathname, headers, origin)` |
| `proxy.ts`                                        | Uses `isAllowedMutation` in place of the bare `isSameOrigin` check            |
| `next.config.ts`                                  | `headers()` adds the `frame-ancestors` policy to all routes                   |
| `features/shortcuts/components/shortcut-grid.tsx` | Tile link gets `target="_top"`                                                |

No migration, and no API or data model changes. `POST /api/reading-items` is used as it is.

## Tech Stack

As in [SPEC-platform.md](SPEC-platform.md). The extension is Manifest V3 in plain JavaScript modules with no bundler and
no new dependencies.

## Commands

`pnpm lint | typecheck | test | build`. Install: `chrome://extensions` → Developer mode → Load unpacked → `extension/`.
After a change, press reload on the extension card. Generate the id once with `openssl genrsa` and keep only the
public key in the manifest.

## Project Structure

```
extension/
  manifest.json
  newtab.html, newtab.js      iframe, dark background, unreachable message
  background.js               chrome.action.onClicked: calls the API, sets the badge
  save.js, save.test.ts       pure: request body from a tab, badge from a status
  icons/                      16, 48, 128 px, from public/icons
```

## Code Style

As in [SPEC-platform.md](SPEC-platform.md). Chrome APIs stay in `background.js` and `newtab.js`, so `save.js` can be
tested without a browser.

```json
{
  "manifest_version": 3,
  "name": "Daily Tab",
  "chrome_url_overrides": { "newtab": "newtab.html" },
  "background": { "service_worker": "background.js", "type": "module" },
  "action": { "default_title": "Save to reading list" },
  "permissions": ["activeTab"],
  "host_permissions": ["https://daily-tab.vercel.app/*"]
}
```

## Testing Strategy

- **Unit:** `save.js` (title trim, 120-character cut, hostname fallback, http/https check, every badge row);
  `isAllowedMutation` (same origin allowed, extension origin allowed only for `POST /api/reading-items`, foreign and
  missing origins rejected).
- **Regression:** `proxy.test.ts` and the existing suite pass, including same-origin rejection on every other route.
- **HTTP smoke against `next start`:** the `frame-ancestors` header on a page; a `POST` with the extension origin
  succeeds on `/api/reading-items` and gets `403` on another route.
- **Browser E2E:** still deferred. The owner runs the feasibility check and the final pass by hand.

## Boundaries

- **Always:** keep permissions to the two listed; deploy the app changes before relying on them in the extension; read
  the `headers` guide in `node_modules/next/dist/docs/` before changing `next.config.ts`.
- **Ask first:** any new extension permission; allowing the extension origin on another route; API tokens; any change
  to the session cookie's attributes; new dependencies.
- **Never:** `SameSite=None`; a wildcard in `frame-ancestors` or the origin check; committing the private key; loading
  remote scripts in the extension.

## Success Criteria

- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` pass.
- [ ] The feasibility gate is recorded as passed, or the fallback is applied and this spec updated.
- [ ] Pages send the `frame-ancestors` header naming only the extension.
- [ ] The extension origin can `POST /api/reading-items` and gets `403` on every other mutating route.
- [ ] A cross-site page cannot frame the app.
- [ ] Owner: a new tab shows the app signed in, the address bar takes typing at once, and a tile replaces the whole tab.
- [ ] Owner: signing in from inside the frame works; offline shows the message and Retry recovers.
- [ ] Owner: each badge result appears, and a saved page shows up on `/reading-list` under No topic.

## Not Doing (and why)

- **Chrome Web Store:** owner chose load unpacked.
- **Switching to a local server:** owner chose production only; testing locally means editing one constant.
- **Android:** Chrome for Android has no extensions; the PWA covers it.
- **API tokens:** the existing cookie is enough for one user on one browser profile.
- **Offline copy of the app, page metadata fetching, context menu, keyboard shortcut:** not requested.

## Decisions

- The save button is one click with No topic. Picking a topic or adding a note first would need a popup, which is not
  in this version.
- `feat/reading-list` merges before this module starts, since the save button needs its API in production.
