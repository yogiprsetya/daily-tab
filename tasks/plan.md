# Implementation Plan: obsidian

Spec: [SPEC-obsidian.md](../SPEC-obsidian.md) · Map: [CAPABILITY-MAP.md](../CAPABILITY-MAP.md) · Tasks: [todo.md](todo.md)
Previous modules: [archive/](archive/)

## Overview

A read-only view of the Obsidian vault: browse folders, read a note, and search by name and content. The **browser**
opens the vault folder through the File System Access API and remembers the handle in IndexedDB, so no server ever sees
a file and no environment variable is involved. No database, migration, API route or server code; two new dependencies
for Markdown, both in the client bundle.

This replaces a server-side design that could not work: the app runs in WSL while the vault is at
`D:\Documents\obs-vault`, and the server's `realpath` guard needs a POSIX path inside the app's own filesystem, so the
page answered "Vault folder not found" for every configuration.

## Architecture Decisions

- **The picker is the trust boundary.** A `FileSystemDirectoryHandle` cannot leave the chosen folder — the browser
  enforces that, so the escape tests in the old design are handled for free. What is left to validate is the shape of
  `?folder=` and `?note=` (no `..`, no hidden names, folders and `.md` only), which `entries.ts` and `note.ts` do.
- **One seam, fake handles in tests.** Every reader takes a `FileSystemDirectoryHandle` as its first argument and never
  touches `window`. Tests pass a fake handle backed by the fixture tree read through `node:fs`, so the suite stays in
  Vitest on Node with no browser and no Playwright. Only `vault-handle.ts` needs a browser, and it is about twenty lines.
- **URL as state, as in bookmarks.** `?folder=`, `?note=` and `?q=` stay in the URL, but the view is a Client Component
  reading `useSearchParams()`, so the page itself stays static and no note content is ever a server concern.
- **Expect the folder to be forgotten.** Permission can lapse, and Obsidian's folder can move. `queryPermission` decides
  between listing, "Allow access" and starting over, rather than failing with an error the owner cannot act on.
- **Search keeps text in memory.** A module-level map of path → `lastModified` and text, inside the worker. Each search
  re-reads only changed notes, which keeps repeat searches fast on a vault of several hundred notes.
- **Markdown stays safe by construction.** `react-markdown` without `rehype-raw`, so raw HTML is text, and a
  `urlTransform` that keeps only `http`/`https` links.

## Task List

### Before starting

- [ ] Owner approves the revised plan

### Foundation

- [ ] Task 1: Remove the server-side design
- [ ] Task 2: Pick, remember and restore the vault folder
- [ ] Task 3: Browse folders

### Checkpoint A: The real vault lists

- [ ] Gates pass; owner picks `obs-vault` once and sees the real folders after a reload

### Reading and search

- [ ] Task 4: Read a note
- [ ] Task 5: Search by note name
- [ ] Task 6: Search note contents

### Checkpoint B: Works on the real vault (owner)

- [ ] Gates pass; owner browses, reads and searches the real vault at desktop width

- [ ] Task 7: README section
- [ ] Task 8: Release (human-gated)

## Risks and Mitigations

| Risk                                                           | Impact | Mitigation                                                                 |
| -------------------------------------------------------------- | ------ | -------------------------------------------------------------------------- |
| A note's HTML or `javascript:` link runs in the app            | High   | No `rehype-raw`; `urlTransform` allows `http`/`https` only; tested         |
| Chrome drops the stored handle, or Obsidian's folder moves     | Med    | Three explicit states; `queryPermission` decides, never a dead end         |
| The owner opens the app on Android and finds no vault          | Med    | Capability check before rendering, with an explanation instead of a button |
| `FileSystemDirectoryHandle` types are missing from the DOM lib | Low    | One local type augmentation for `queryPermission`/`requestPermission`      |
| Content search freezes the page on a large vault               | Med    | The scan runs in a worker; text cached by `lastModified`; 50-result cap    |
| `react-markdown` in the client bundle grows the page           | Low    | Two routes share it via the module only; measured in Task 8                |
| A stale `OBSIDIAN_VAULT_PATH` confuses the next reader         | Low    | Removed from `lib/env.ts` and from `.env.local` in Task 1                  |

## Parallelization

Sequential: Tasks 4–6 all build on the handle, the seam and the view from Tasks 2–3.
