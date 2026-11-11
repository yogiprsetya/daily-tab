# Tasks: obsidian

Plan: [plan.md](plan.md) · Spec: [SPEC-obsidian.md](../SPEC-obsidian.md)

Standing verification for every task: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`. Write tests first.

> **Revised 2026-11-10.** Access moves from the server to the browser (File System Access API). The old Tasks 1–2 are
> reverted by Task 1 here; everything below is new. Reasoning is in the spec's Decisions section.

## Before starting

- [ ] Owner approves the revised plan

## Foundation

- [x] **Task 1: Remove the server-side design**
  - Description: drop `OBSIDIAN_VAULT_PATH` from `lib/env.ts` and `.env.local`; delete `vault.ts` and `vault.test.ts`;
    replace `obsidian-view.tsx` with a client shell that renders only the picker state; keep `href.ts` and the fixture
    tree.
  - Acceptance:
    - [x] `lib/env.ts` no longer mentions the vault; `.env.local` keeps only the database and auth values.
    - [x] No server file reads remain: `pnpm build` passes and `/obsidian` renders without touching a filesystem.
    - [x] `features/obsidian/fixtures/vault/` survives for the new tests, minus the symlink the old guard needed.
  - Verify: `pnpm test lib/env`; `pnpm build`; `rg OBSIDIAN_VAULT_PATH` matches only spec history
  - Dependencies: none
  - Files: `lib/env.ts`, `lib/env.test.ts`, `.env.local`, `features/obsidian/vault.ts` (delete),
    `features/obsidian/vault.test.ts` (delete), `components/obsidian-view.tsx`, `components/vault-notice.tsx`
  - Scope: M
  - Notes: the session gate moved into `app/(app)/obsidian/page.tsx`, because a Client Component cannot call
    `requirePageSession()`. `entries.ts` now owns the `Entry` type. Verified: lint and typecheck clean, build passes,
    `/obsidian` → `307 /login` signed out and renders the picker copy signed in, other pages `200`.
    `pnpm test` needs the local Postgres on `127.0.0.1:54322`, which was down; `lib/env.test.ts` passed in isolation.

- [x] **Task 2: Pick, remember and restore the vault folder**
  - Description: `vault-handle.ts` with `pickVault`, `loadHandle`, `forgetVault` and `ensurePermission` over IndexedDB;
    the capability check; `vault-picker.tsx` for the three states.
  - Acceptance:
    - [x] No API: "The vault opens in Chrome or Edge on a desktop", and no button.
    - [x] First visit: one button; cancelling the picker leaves the page unchanged.
    - [x] After picking, the vault name shows; after a reload the folder lists with no further click.
    - [x] `'prompt'` shows "Allow access"; `'denied'` or a vanished folder clears the handle and returns to first visit.
    - [x] "Change folder" re-opens the picker.
  - Verify: `pnpm test features/obsidian` (the state machine, not the browser API); manual check in Chrome
  - Dependencies: Task 1
  - Files: `vault-handle.ts`, `vault-handle.test.ts`, `components/vault-picker.tsx`, `components/obsidian-view.tsx`
  - Scope: M
  - Notes: `file-system-access.d.ts` augments the DOM lib with `showDirectoryPicker`, `queryPermission` and
    `requestPermission` (TypeScript does not declare them). `vault-handle.test.ts` covers `resolveVaultState` with plain
    objects, 7 tests passing. Lint, typecheck and build clean; `/obsidian` still renders `Opening the vault…` on the
    server. **The interactive picker was not verified in a browser**: this environment's port forwarding rewrites the
    origin, so login fails in the browser and Playwright's cookie API is unavailable. The owner must confirm states 1–3
    by hand.

- [ ] **Task 3: Browse folders**
  - Description: `entries.ts` with `listFolder` over a handle; `folder-list.tsx` wired to `?folder=`; breadcrumb.
  - Acceptance:
    - [ ] Folders first, then notes, sorted by name ignoring case; only folders and `.md`; hidden names left out.
    - [ ] Notes show without `.md`; an empty folder shows "This folder is empty."
    - [ ] `..`, absolute paths, hidden names and non-`.md` names show "Note not found".
  - Verify: `pnpm test features/obsidian`; manual browse of the real vault
  - Dependencies: Task 2
  - Files: `entries.ts`, `entries.test.ts`, `components/folder-list.tsx`, `components/vault-breadcrumb.tsx`,
    `components/obsidian-view.tsx`, `fixtures/vault/*`
  - Scope: M

## Checkpoint A: The real vault lists

- [ ] Gates pass
- [ ] Owner picks the vault folder once and sees the real folders, still there after a reload and a Chrome restart

## Reading and search

- [ ] **Task 4: Read a note**
  - Description: add `react-markdown` and `remark-gfm`; `note.ts` for frontmatter and the 1 MB limit; `readNote` over a
    handle; `note-view.tsx` for `?note=`.
  - Acceptance:
    - [ ] Headings, lists, read-only task lists, tables, code and quotes render; frontmatter is hidden.
    - [ ] Raw HTML shows as text; only `http`/`https` links are links and open in a new tab.
    - [ ] Over 1 MB shows "This note is too large to show".
  - Verify: `pnpm test features/obsidian`; manual read of a real note
  - Dependencies: Task 3
  - Files: `package.json`, `note.ts`, `note.test.ts`, `markdown.ts`, `markdown.test.ts`, `components/note-view.tsx`
  - Scope: M

- [ ] **Task 5: Search by note name**
  - Description: `vault-search.tsx` above the list, replacing `?q=` after a pause; `searchNames` in `search.ts`.
  - Acceptance:
    - [ ] Matches ignore case and show each note's folder.
    - [ ] Fewer than 2 characters shows nothing; no match shows "No notes match".
  - Verify: `pnpm test features/obsidian`
  - Dependencies: Task 3
  - Files: `search.ts`, `search.test.ts`, `components/vault-search.tsx`, `components/obsidian-view.tsx`
  - Scope: S

- [ ] **Task 6: Search note contents**
  - Description: content matches after name matches, each with a one-line snippet; the worker and the `lastModified`
    text cache.
  - Acceptance:
    - [ ] Name matches come first; content matches carry a snippet around the first hit; at most 50 results.
    - [ ] A changed note is re-read on the next search; unchanged notes are not.
    - [ ] Hidden folders and files over 1 MB are not searched; the page stays responsive during a scan.
  - Verify: `pnpm test features/obsidian`; owner times a search on the real vault
  - Dependencies: Task 5
  - Files: `search.ts`, `search.test.ts`, `search.worker.ts`, `components/vault-search.tsx`
  - Scope: M

## Checkpoint B: Works on the real vault (owner)

- [ ] Gates pass
- [ ] Owner browses, reads and searches the real vault at desktop width

- [ ] **Task 7: README section**
  - Acceptance:
    - [ ] How to pick the vault folder, that it is remembered per browser profile, that Android cannot open it, and
          that `OBSIDIAN_VAULT_PATH` is gone.
  - Dependencies: Checkpoint B
  - Files: `README.md`
  - Scope: XS

- [ ] **Task 8: Release (human-gated)**
  - Acceptance:
    - [ ] Merged and deployed with no vault-related env var in Vercel.
    - [ ] Production `/obsidian` asks for the folder, then lists the real vault; every other page is unchanged.
  - Dependencies: Task 7
  - Scope: XS
