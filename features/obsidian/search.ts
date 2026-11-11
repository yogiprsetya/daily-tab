import { parsePath } from './entries';

/** Below this many characters a query shows nothing: one letter matches almost every note. */
export const MIN_QUERY = 2;

/** Name and content matches share one list, so this bounds the whole result set. */
export const MAX_RESULTS = 50;

const NOTE = /\.md$/i;
const isHidden = (name: string) => name.startsWith('.');

export type NoteRef = {
  /** From the vault root, with `/`, ending in `.md`. */
  path: string;
  /** Without `.md`, as the list shows it. */
  name: string;
  /** The folder it sits in, or '' at the root. */
  folder: string;
  handle: FileSystemFileHandle;
};

export type SearchHit = {
  path: string;
  name: string;
  folder: string;
};

/**
 * Every note in the vault, depth first, skipping hidden names and other file
 * types. A folder that cannot be read is skipped rather than failing the walk:
 * a vault can contain a shortcut or a folder the owner cannot open.
 */
export async function listAllNotes(
  root: FileSystemDirectoryHandle,
  relative = ''
): Promise<NoteRef[]> {
  const segments = parsePath(relative);
  if (!segments) return [];

  const notes: NoteRef[] = [];

  async function walk(
    dir: FileSystemDirectoryHandle,
    base: string[],
    depth: number
  ) {
    // A symlinked folder loop would otherwise walk forever.
    if (depth > 32) return;

    let entries: [string, FileSystemHandle][];
    try {
      entries = [];
      for await (const entry of dir.entries()) entries.push(entry);
    } catch {
      return;
    }

    for (const [name, child] of entries) {
      if (isHidden(name)) continue;
      const path = [...base, name];

      if (child.kind === 'directory') {
        await walk(child as FileSystemDirectoryHandle, path, depth + 1);
      } else if (child.kind === 'file' && NOTE.test(name)) {
        notes.push({
          path: path.join('/'),
          name: name.replace(NOTE, ''),
          folder: base.join('/'),
          handle: child as FileSystemFileHandle,
        });
      }
    }
  }

  await walk(root, [], 0);
  return notes;
}

const normalize = (value: string) => value.toLocaleLowerCase();

/**
 * Notes whose name contains the query, ignoring case. Name matches come first by
 * construction: this is the first half of the result list that content matches
 * will be appended to.
 */
export function searchNames(notes: NoteRef[], query: string): SearchHit[] {
  const needle = normalize(query.trim());
  if (needle.length < MIN_QUERY) return [];

  return notes
    .filter((note) => normalize(note.name).includes(needle))
    .sort(
      (a, b) =>
        // A name that starts with the query beats one that only contains it.
        prefixRank(a.name, needle) - prefixRank(b.name, needle) ||
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    )
    .slice(0, MAX_RESULTS)
    .map(({ path, name, folder }) => ({ path, name, folder }));
}

function prefixRank(name: string, needle: string): number {
  return normalize(name).startsWith(needle) ? 0 : 1;
}

/** Text of a note, cached by the file's `lastModified` so an unchanged note is not re-read. */
type TextCache = Map<string, { modified: number; text: string }>;

export function createTextCache(): TextCache {
  return new Map();
}

/**
 * Reads a note's text, reusing the cached copy while `lastModified` is
 * unchanged. A file that cannot be read is treated as empty: one unreadable
 * note should not fail a search.
 */
export async function noteText(
  note: NoteRef,
  cache: TextCache
): Promise<string> {
  const file = await note.handle.getFile();
  const cached = cache.get(note.path);
  if (cached && cached.modified === file.lastModified) return cached.text;

  const text = await file.text();
  cache.set(note.path, { modified: file.lastModified, text });
  return text;
}

const SNIPPET_BEFORE = 40;
const SNIPPET_AFTER = 60;

/**
 * One line around the first hit, with ellipses where text was cut. Newlines
 * collapse to spaces so a paragraph still reads as a single line.
 */
export function snippetOf(text: string, needle: string): string {
  const flat = text.replace(/\s+/g, ' ');
  const index = normalize(flat).indexOf(needle);
  if (index === -1) return flat.slice(0, SNIPPET_BEFORE + SNIPPET_AFTER).trim();

  const start = Math.max(0, index - SNIPPET_BEFORE);
  const end = Math.min(flat.length, index + needle.length + SNIPPET_AFTER);
  return `${start > 0 ? '…' : ''}${flat.slice(start, end).trim()}${
    end < flat.length ? '…' : ''
  }`;
}

export type ContentHit = SearchHit & { snippet: string };

/**
 * Notes whose contents contain the query, appended after the name matches.
 * `limit` is what is left of `MAX_RESULTS`, so the combined list stays bounded.
 * A note already matched by name is skipped: one row per note.
 */
export async function searchContents(
  notes: NoteRef[],
  query: string,
  options: { cache: TextCache; limit: number; skip: Set<string> }
): Promise<ContentHit[]> {
  const needle = normalize(query.trim());
  if (needle.length < MIN_QUERY || options.limit <= 0) return [];

  const hits: ContentHit[] = [];
  for (const note of notes) {
    if (hits.length >= options.limit) break;
    if (options.skip.has(note.path)) continue;

    let text: string;
    try {
      text = await noteText(note, options.cache);
    } catch {
      continue;
    }
    if (!normalize(text).includes(needle)) continue;

    hits.push({
      path: note.path,
      name: note.name,
      folder: note.folder,
      snippet: snippetOf(text, needle),
    });
  }
  return hits;
}

/** Name matches first, then content matches, up to `MAX_RESULTS` in total. */
export async function searchVault(
  notes: NoteRef[],
  query: string,
  cache: TextCache
): Promise<(SearchHit & { snippet?: string })[]> {
  const named = searchNames(notes, query);
  const contents = await searchContents(notes, query, {
    cache,
    limit: MAX_RESULTS - named.length,
    skip: new Set(named.map((hit) => hit.path)),
  });

  return [...named, ...contents];
}
