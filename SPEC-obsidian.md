# Spec: obsidian

Status: **Approved 2026-11-10**
Module id: `obsidian` (see [CAPABILITY-MAP.md](CAPABILITY-MAP.md)) · Depends on: `auth`

## Objective

Read the owner's Obsidian vault inside Daily Tab: browse its folders, open a note, and find notes by name or by text.
The app reads the vault folder straight from disk, so this works only when Daily Tab runs on the owner's PC
(`pnpm dev` or `next start`). On https://daily-tab.vercel.app and the Android PWA the page says so instead. Nothing is
ever written to the vault.

### Acceptance criteria

1. Availability
   - `OBSIDIAN_VAULT_PATH` (an absolute path) turns the module on. Unset, `/obsidian` shows "The vault is available when
     Daily Tab runs on your PC" and touches no files. Set to a folder that does not exist, it shows "Vault folder not
     found" without the path.
   - Every other page works the same with or without the variable.
2. Browse
   - `/obsidian` lists the vault root: folders first, then notes, each sorted by name ignoring case.
     `/obsidian?folder=<relative path>` lists a folder, with a breadcrumb back to the root.
   - Only folders and `.md` files appear. Names starting with `.` (such as `.obsidian` and `.trash`) are hidden.
   - A note shows without its `.md` extension.
3. Read
   - `/obsidian?note=<relative path>` renders the note with GitHub-flavoured Markdown: headings, lists, task lists
     (read-only checkboxes), tables, code blocks, quotes and links.
   - YAML frontmatter is not shown. Raw HTML in a note is shown as text, never run.
   - `http` and `https` links open in a new tab. Other links (relative paths, `obsidian://`, `[[wikilinks]]`, embeds)
     show as plain text.
   - A note over 1 MB shows "This note is too large to show" instead of its content.
4. Search
   - A search box above the list filters by note name as you type, with the query in the URL (`?q=`).
   - The same query also searches note contents, ignoring case. Results list name matches first, then content
     matches, each with its folder and a one-line snippet around the first hit. At most 50 results.
   - Queries shorter than 2 characters show nothing. "No notes match" when nothing is found.
5. Safety
   - A `folder` or `note` value that points outside the vault (`..`, an absolute path, a symlink that leads out, or an
     encoded form of these), at a hidden name, or at anything other than a folder or `.md` file shows "Note not found".
     The vault path never appears in a page or a log.
   - The page calls `requirePageSession()` and renders behind `<Suspense>`.
   - Files are only read: no write, rename or delete call exists in the module.

## Data flow

No database tables, no migration, and no API routes: the module only reads, and Server Components read through the
module's `vault.ts`, as the platform spec says for reads. Search keeps an in-memory copy of note text keyed by path and
modified time, so a repeat search only re-reads changed notes.

## Tech Stack

As in [SPEC-platform.md](SPEC-platform.md), plus two new dependencies approved for this module:

| Package          | Kind | Why                                                        |
| ---------------- | ---- | ---------------------------------------------------------- |
| `react-markdown` | dep  | Markdown to React elements on the server; ignores raw HTML |
| `remark-gfm`     | dep  | Tables, task lists, strikethrough and autolinks            |

## Commands

`pnpm dev | build | lint | typecheck | test`. Local use: set `OBSIDIAN_VAULT_PATH` in `.env.local`, for example
`/mnt/c/Users/<you>/Documents/<Vault>` from WSL. Never set it in Vercel.

## Project Structure

```
features/obsidian/
  vault.ts, vault.test.ts       resolve a relative path safely, list a folder, read a note
  search.ts, search.test.ts     name and content search with snippets, in-memory text cache
  markdown.ts, markdown.test.ts frontmatter stripping, link filter
  fixtures/vault/               small test vault: nested folders, hidden folder, frontmatter, symlink, large note
  components/
    obsidian-view.tsx           async Server Component: session, URL, vault
    folder-list.tsx, note-view.tsx, vault-search.tsx, obsidian-skeleton.tsx
app/(app)/obsidian/page.tsx     replaces the placeholder
lib/env.ts                      optional OBSIDIAN_VAULT_PATH
```

## Code Style

As in [SPEC-platform.md](SPEC-platform.md). Filesystem access stays in `vault.ts` and `search.ts`, behind one guard:

```ts
/** The real path inside the vault, or null for anything that leaves it or is hidden. */
export async function resolveInVault(
  root: string,
  relative: string
): Promise<string | null>;
```

## Testing Strategy

- **Unit and integration on the fixture vault (real files, no mocks):** sorting and hidden names; every traversal form
  (`..`, absolute, encoded, symlink out, hidden, non-`.md`); frontmatter; the 1 MB limit; name-first ordering, snippets,
  the 50-result cap, the 2-character minimum and cache refresh after a file changes.
- **Rendering:** raw HTML stays text; only `http`/`https` links become links; task lists are read-only.
- **HTTP smoke against `next start`:** with the variable unset, the unavailable message; with it set to the fixture
  vault, a folder, a note, a search and a traversal attempt.
- **Browser:** the owner checks reading and searching their real vault, at desktop and phone width.

## Boundaries

- **Always:** go through `resolveInVault` for every path; keep the vault path out of responses and logs; read the
  relevant guide in `node_modules/next/dist/docs/` before using a Next.js API.
- **Ask first:** writing to the vault; any dependency beyond the two above; Google Drive or any upload of notes.
- **Never:** follow a path outside the vault; render a note's raw HTML; set `OBSIDIAN_VAULT_PATH` in Vercel.

## Success Criteria

- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` pass.
- [ ] Without the variable, `/obsidian` shows the unavailable message and production is unchanged.
- [ ] Every traversal form in the tests shows "Note not found".
- [ ] A note with raw HTML shows it as text.
- [ ] Owner: browsing, reading and both searches work on the real vault at desktop and phone width.

## Not Doing (and why)

- **Google Drive and Remotely Save:** owner chose local access only.
- **Deployed site and Android:** follows from local access; the page explains it there.
- **Wikilinks, embedded images, backlinks, graph:** not chosen for this version.
- **Editing or creating notes:** the module is read-only.
- **Plugin output (Dataview, Canvas, Excalidraw):** needs Obsidian itself.

## Decisions

- Which database a local run uses stays the owner's choice in `.env.local`; this module does not depend on it.
- The New Tab extension keeps opening production, where this page shows the unavailable message.
