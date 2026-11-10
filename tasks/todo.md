# Tasks: obsidian

Plan: [plan.md](plan.md) · Spec: [SPEC-obsidian.md](../SPEC-obsidian.md)

Standing verification for every task: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`. Write tests first.

## Before starting

- [x] Owner approves this plan

## Foundation

- [ ] **Task 1: Availability switch and the page shell**
  - Description: optional `OBSIDIAN_VAULT_PATH` in `lib/env.ts`; `openVault()` reporting off, missing or ready;
    `/obsidian` replaced with `obsidian-view.tsx` behind `<Suspense>`, showing the two messages; skeleton.
  - Acceptance:
    - [ ] Unset: "The vault is available when Daily Tab runs on your PC", with no file access.
    - [ ] A folder that does not exist: "Vault folder not found", without the path.
    - [ ] Relative paths are rejected by the env schema; other pages are unaffected; `/obsidian` stays partially static.
  - Verify: `pnpm test lib/env features/obsidian`; `pnpm build` output has no tracing warnings for the vault
  - Dependencies: none
  - Files: `lib/env.ts`, `features/obsidian/vault.ts`, `components/obsidian-view.tsx`, `obsidian-skeleton.tsx`,
    `app/(app)/obsidian/page.tsx`
  - Scope: M

- [ ] **Task 2: Safe paths and folder browsing**
  - Description: `resolveInVault` and `listFolder` in `vault.ts`, the fixture vault, `folder-list.tsx` with a
    breadcrumb, and `?folder=` handling.
  - Acceptance:
    - [ ] Folders first, then notes, sorted by name ignoring case; only folders and `.md`; hidden names left out.
    - [ ] `..`, absolute paths, encoded forms, hidden names, non-`.md` files and a symlink out all resolve to `null`.
    - [ ] Notes show without `.md`; an unknown folder shows "Note not found".
  - Verify: `pnpm test features/obsidian`; HTTP smoke on the fixture vault
  - Dependencies: Task 1
  - Files: `vault.ts`, `vault.test.ts`, `fixtures/vault/*`, `components/folder-list.tsx`, `obsidian-view.tsx`
  - Scope: M

## Checkpoint A: Browse locally

- [ ] Gates and HTTP smoke on the fixture vault pass
- [ ] Owner sets `OBSIDIAN_VAULT_PATH` and browses the real vault

## Reading and search

- [ ] **Task 3: Read a note**
  - Description: add `react-markdown` and `remark-gfm`; `markdown.ts` strips frontmatter and filters links; `readNote`
    with the 1 MB limit; `note-view.tsx` for `?note=`.
  - Acceptance:
    - [ ] Headings, lists, read-only task lists, tables, code and quotes render; frontmatter is hidden.
    - [ ] Raw HTML shows as text; only `http`/`https` links are links and open in a new tab.
    - [ ] Over 1 MB shows "This note is too large to show".
  - Verify: `pnpm test features/obsidian`; HTTP smoke reads a fixture note
  - Dependencies: Task 2
  - Files: `package.json`, `markdown.ts`, `markdown.test.ts`, `vault.ts`, `components/note-view.tsx`
  - Scope: M

- [ ] **Task 4: Search by note name**
  - Description: `vault-search.tsx` above the list, replacing `?q=` after a pause; `searchNames` in `search.ts`.
  - Acceptance:
    - [ ] Matches ignore case and show each note's folder.
    - [ ] Fewer than 2 characters shows nothing; no match shows "No notes match".
  - Verify: `pnpm test features/obsidian`
  - Dependencies: Task 2
  - Files: `search.ts`, `search.test.ts`, `components/vault-search.tsx`, `obsidian-view.tsx`
  - Scope: S

- [ ] **Task 5: Search note contents**
  - Description: content matches after name matches, each with a one-line snippet; the in-memory text cache.
  - Acceptance:
    - [ ] Name matches come first; content matches carry a snippet around the first hit; at most 50 results.
    - [ ] A changed note is re-read on the next search; unchanged notes are not.
    - [ ] Hidden folders and files over 1 MB are not searched.
  - Verify: `pnpm test features/obsidian`; owner times a search on the real vault
  - Dependencies: Task 4
  - Files: `search.ts`, `search.test.ts`, `components/folder-list.tsx`
  - Scope: M

## Checkpoint B: Works on the real vault (owner)

- [ ] Gates pass
- [ ] Owner browses, reads and searches the real vault at desktop and phone width

- [ ] **Task 6: README section**
  - Acceptance:
    - [ ] How to set `OBSIDIAN_VAULT_PATH` from WSL, that it only works locally, and what is not rendered.
  - Dependencies: Checkpoint B
  - Files: `README.md`
  - Scope: XS

- [ ] **Task 7: Release (human-gated)**
  - Acceptance:
    - [ ] Merged and deployed with `OBSIDIAN_VAULT_PATH` unset in Vercel.
    - [ ] Production `/obsidian` shows the unavailable message; every other page is unchanged.
  - Dependencies: Task 6
  - Scope: XS
