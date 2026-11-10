# Implementation Plan: obsidian

Spec: [SPEC-obsidian.md](../SPEC-obsidian.md) · Map: [CAPABILITY-MAP.md](../CAPABILITY-MAP.md) · Tasks: [todo.md](todo.md)
Previous modules: [archive/](archive/)

## Overview

A read-only view of the Obsidian vault folder on the owner's PC: browse folders, read a note, and search by name and
content. `OBSIDIAN_VAULT_PATH` turns it on; without it, as on Vercel, the page explains that the vault is only available
locally. No database, migration or API routes; two new dependencies for Markdown.

## Architecture Decisions

- **One guard for every path.** `resolveInVault` in `vault.ts` turns a URL value into a real path inside the vault or
  `null`, using `realpath` so a symlink cannot lead out. It is built and tested first, before anything reads a file.
- **URL as state, as in bookmarks.** `?folder=`, `?note=` and `?q=` drive a server-rendered view; the search box only
  replaces the URL after a pause.
- **Real files in tests.** A fixture vault under `features/obsidian/fixtures/` (nested folders, hidden folder,
  frontmatter, raw HTML, a symlink out, a large note) instead of mocking `fs`.
- **Search keeps text in memory.** A module-level map of path → modified time and text. Each search lists the vault and
  re-reads only changed notes, which keeps repeat searches fast on a slow `/mnt/c` mount.
- **Markdown stays safe by construction.** `react-markdown` without `rehype-raw`, so raw HTML is text, and a
  `urlTransform` that keeps only `http`/`https` links.

## Task List

### Before starting

- [x] Owner approves this plan

### Foundation

- [x] Task 1: Availability switch and the page shell
- [x] Task 2: Safe paths and folder browsing

### Checkpoint A: Browse locally

- [ ] Gates and HTTP smoke on the fixture vault pass; owner browses the real vault

### Reading and search

- [ ] Task 3: Read a note
- [ ] Task 4: Search by note name
- [ ] Task 5: Search note contents

### Checkpoint B: Works on the real vault (owner)

- [ ] Gates pass; owner reads and searches the real vault at desktop and phone width

- [ ] Task 6: README section
- [ ] Task 7: Release (human-gated)

## Risks and Mitigations

| Risk                                                    | Impact | Mitigation                                                                   |
| ------------------------------------------------------- | ------ | ---------------------------------------------------------------------------- |
| A crafted `?note=` reads a file outside the vault       | High   | One guard with `realpath`; every traversal form tested in Task 2             |
| A note's HTML or `javascript:` link runs in the app     | High   | No `rehype-raw`; `urlTransform` allows `http`/`https` only; tested in Task 3 |
| The build traces or bundles files from a runtime path   | Med    | Path read from env at request time; check build output in Task 1             |
| Full-text search is slow on a large vault over `/mnt/c` | Med    | Text cache by modified time; 50-result cap; measured on the real vault       |
| `OBSIDIAN_VAULT_PATH` is set in Vercel by mistake       | Low    | Missing folder shows "Vault folder not found" without the path               |
| The vault path leaks in an error page or log            | Med    | Errors carry fixed messages; tested                                          |

## Parallelization

Sequential: Tasks 3–5 all build on the guard and the view from Tasks 1–2.
