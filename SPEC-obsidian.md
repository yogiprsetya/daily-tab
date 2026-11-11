# Spec: obsidian

Status: **Revised 2026-11-10** (browser-side access replaces server-side access; see Decisions)
Module id: `obsidian` (see [CAPABILITY-MAP.md](CAPABILITY-MAP.md)) · Depends on: `auth`

## Objective

Read the owner's Obsidian vault inside Daily Tab: browse its folders, open a note, and find notes by name or by text.
The **browser** reads the vault, not the server: the owner picks the vault folder once through the File System Access
API, and that folder handle is remembered in IndexedDB. Notes are read from disk by the browser and rendered in the
page; they are never uploaded, and no server ever sees them.

Because no server touches a filesystem, this works on https://daily-tab.vercel.app and anywhere else the app is
served — the folder always lives on the machine running the browser. It does not work on the Android PWA: that API is
not available there, and the page says so. Nothing is ever written to the vault.

Why this replaced the previous design: the server could not reach the vault on the owner's PC. Daily Tab runs in WSL,
the vault is at `D:\Documents\obs-vault`, and the server-side reader required a POSIX path inside the app's own
filesystem, so `/obsidian` answered "Vault folder not found" on every configuration.

### Acceptance criteria

1. Availability
   - `app/(app)/obsidian/page.tsx` stays a Server Component: it calls `requirePageSession()` inside `<Suspense>` as
     every other module does, then renders the client view. The session gate is unchanged; the vault work is all below it.
   - Before any folder is chosen, `/obsidian` shows "Choose your vault folder" with one button. No file is read and no
     permission is requested until the owner presses it.
   - Pressing the button opens the browser's native folder picker with `mode: 'read'`. Cancelling leaves the page as it
     was, with no error shown.
   - In a browser without `window.showDirectoryPicker` (the Android PWA, Safari, Firefox) the page shows "The vault
     opens in Chrome or Edge on a desktop" and no button.
   - Every other page is unchanged, and `OBSIDIAN_VAULT_PATH` is no longer read anywhere.
2. Remembering the folder
   - The chosen `FileSystemDirectoryHandle` is stored in IndexedDB and shown as the vault name, never as a full path —
     the browser does not expose one.
   - On the next visit the handle is restored and its permission re-checked with `queryPermission`. Held in `'granted'`
     state, the vault lists straight away with no click.
   - Permission in `'prompt'` state shows "Allow access" and one click grants it; `'denied'`, a deleted folder, or a
     handle that no longer resolves falls back to state 1 and clears the stored handle.
   - A "Change folder" action re-opens the picker and replaces the stored handle.
3. Browse
   - With the vault open, `/obsidian` lists the root: folders first, then notes, each sorted by name ignoring case.
     `/obsidian?folder=<relative path>` lists a folder, with a breadcrumb back to the root.
   - Only folders and `.md` files appear. Names starting with `.` (such as `.obsidian` and `.trash`) are hidden.
   - A note shows without its `.md` extension, and an empty folder shows "This folder is empty."
4. Read
   - `/obsidian?note=<relative path>` renders the note with GitHub-flavoured Markdown: headings, lists, task lists
     (read-only checkboxes), tables, code blocks, quotes and links.
   - YAML frontmatter is not shown. Raw HTML in a note is shown as text, never run.
   - `http` and `https` links open in a new tab. Other links (relative paths, `obsidian://`, `[[wikilinks]]`, embeds)
     show as plain text.
   - A note over 1 MB shows "This note is too large to show" instead of its content.
5. Search
   - A search box above the list filters by note name as you type, with the query in the URL (`?q=`).
   - The same query also searches note contents, ignoring case. Results list name matches first, then content
     matches, each with its folder and a one-line snippet around the first hit. At most 50 results.
   - Queries shorter than 2 characters show nothing. "No notes match" when nothing is found.
   - Searching a vault of 500 notes keeps the page responsive: the text scan runs off the main thread.
6. Safety
   - A `folder` or `note` value that names anything but a folder or `.md` file inside the vault — including `..`, an
     absolute path, a hidden name or an encoded form of these — shows "Note not found".
   - No request carries note content or a path to any server: the network tab shows no request while browsing,
     reading or searching.
   - Files are only read: the picker is opened with `mode: 'read'` and no write, rename or remove call exists in the
     module.
   - The folder picker requires a click; a stored handle is never granted permission without one.

## Data flow

No database tables, no migration, no API routes and no server code. Everything happens in the browser:

```
pick folder ──▶ FileSystemDirectoryHandle ──▶ IndexedDB (remembered)
                       │
                       ├── entries(name) ──▶ FolderList
                       ├── file.text()    ──▶ Markdown  ──▶ NoteView
                       └── file.text()    ──▶ Search (worker, in-memory text cache)
```

`?folder=`, `?note=` and `?q=` stay in the URL so a note can be linked and the back button works, but reading them is
a client concern: the page renders a loader and the vault components read `useSearchParams()`.

Search keeps an in-memory copy of note text keyed by path and `lastModified`, so a repeat search only re-reads changed
notes. That cache lives in the worker and dies with the tab.

## Tech Stack

As in [SPEC-platform.md](SPEC-platform.md). No new dependency: the File System Access API is built into Chrome and
Edge, and the IndexedDB wrapper is about twenty lines.

| Package          | Kind | Why                                                         |
| ---------------- | ---- | ----------------------------------------------------------- |
| `react-markdown` | dep  | Markdown to React elements in the browser; ignores raw HTML |
| `remark-gfm`     | dep  | Tables, task lists, strikethrough and autolinks             |

`react-markdown` and `remark-gfm` move from the server bundle to the client bundle. They stay the only additions, and
both ship with `skipHtml` behaviour by default, which is what acceptance 4 relies on.

## Commands

`pnpm dev | build | lint | typecheck | test`. No environment variable is involved. The vault folder is chosen in the
browser, so `pnpm dev`, `pnpm start` and the deployed site all behave the same way.

## Project Structure

```
features/obsidian/
  vault-handle.ts, vault-handle.test.ts   pick a folder, remember it in IndexedDB, check permission
  entries.ts, entries.test.ts             list a folder as folders then notes, hidden names left out
  note.ts, note.test.ts                   frontmatter stripping, the 1 MB limit
  search.ts, search.test.ts               name and content search with snippets, text cache
  search.worker.ts                        runs the content scan off the main thread
  markdown.ts, markdown.test.ts           link filter for react-markdown
  fixtures/vault/                         fixture tree for tests: nested folders, hidden names, frontmatter,
                                          non-`.md` files, a note over 1 MB
  components/
    obsidian-view.tsx                     client: URL state, picker states, list or note
    vault-picker.tsx                      "Choose your vault folder", "Allow access", "Change folder"
    folder-list.tsx, note-view.tsx, vault-search.tsx, obsidian-skeleton.tsx
app/(app)/obsidian/page.tsx               Server Component: requirePageSession() inside <Suspense>, then the view
lib/env.ts                                removes OBSIDIAN_VAULT_PATH
```

## Code Style

As in [SPEC-platform.md](SPEC-platform.md). Browser storage access stays in `vault-handle.ts`, behind one seam that
tests can replace:

```ts
/** The remembered vault folder, or null when none is stored or it no longer resolves. */
export async function loadHandle(): Promise<FileSystemDirectoryHandle | null>;
```

Everything that reads files takes that handle as its first argument and never touches `window`:

```ts
export async function listFolder(
  handle: FileSystemDirectoryHandle
): Promise<Entry[]>;
export async function readNote(
  handle: FileSystemDirectoryHandle,
  path: string
): Promise<string | null>;
```

That seam is what keeps the module testable: tests pass a fake handle backed by the fixture tree, so no browser and no
Playwright is needed. The File System Access API's own types come from TypeScript's DOM lib, augmented with
`queryPermission`/`requestPermission`, which the lib does not declare yet.

## Testing Strategy

- **Unit tests on fake handles over the fixture tree (real files read through `node:fs`):** sorting and hidden names;
  every rejected form (`..`, absolute, hidden, non-`.md`, trailing slash, empty segment); frontmatter; the 1 MB limit;
  name-first ordering, snippets, the 50-result cap, the 2-character minimum and cache refresh after `lastModified`
  changes. `loadHandle` and the picker are thin and verified by hand instead.
- **Rendering:** raw HTML stays text; only `http`/`https` links become links; task lists are read-only.
- **Browser, by the owner:** choose the real vault once; confirm it is remembered after a reload and after closing
  Chrome; confirm "Allow access" appears when permission lapses; browse, read and both searches at desktop width.
- **Browser, in DevTools:** the Network tab stays empty while browsing, reading and searching.

## Boundaries

- **Always:** pass every path from the URL through the same validator before touching a handle; read files only; read
  the relevant guide in `node_modules/next/dist/docs/` before using a Next.js API.
- **Ask first:** writing to the vault; any dependency beyond the two above; uploading notes anywhere.
- **Never:** request `'readwrite'`; send note content or vault paths to a server; render a note's raw HTML; grant
  permission without a user gesture.

## Success Criteria

- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` pass.
- [ ] In Chrome desktop, choosing the real vault once makes it list, read and search, and it is still there after a
      reload and after restarting Chrome.
- [ ] A browser without the API shows the desktop-only message; the Android PWA is one of them.
- [ ] Every rejected path form in the tests shows "Note not found".
- [ ] A note with raw HTML shows it as text.
- [ ] The Network tab shows no request while browsing, reading or searching.
- [ ] Production `/obsidian` works once the folder is picked; every other page is unchanged.

## Not Doing (and why)

- **Server-side reading and `OBSIDIAN_VAULT_PATH`:** removed — the server could not reach the vault on the owner's PC
  and reported "Vault folder not found" for every configuration.
- **Android and iOS:** the File System Access API is unavailable there (MDN: Chrome Android 132+ lists
  `showDirectoryPicker`, caniuse says no; iOS has no support at all). Unverified on a device and not planned.
- **Google Drive, Remotely Save, any remote vault:** owner chose direct local access.
- **Wikilinks, embedded images, backlinks, graph:** not chosen for this version.
- **Editing or creating notes:** the module is read-only.
- **Plugin output (Dataview, Canvas, Excalidraw):** needs Obsidian itself.

## Decisions

- 2026-11-10: access moves from the server to the browser, because the server cannot see `D:\Documents\obs-vault`.
  The chosen trade-off is that the folder must be picked once per browser profile, and desktop only.
- 2026-11-10: desktop only. The mobile PWA keeps working for every other module and shows a plain explanation here.
- Which database a local run uses stays the owner's choice in `.env.local`; this module does not depend on it.
- The New Tab extension keeps opening production, where this page now works in Chrome desktop after one folder pick.
