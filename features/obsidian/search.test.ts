import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { fakeDirectory } from './fixtures/fake-handle';
import {
  createTextCache,
  listAllNotes,
  MAX_RESULTS,
  MIN_QUERY,
  noteText,
  searchContents,
  searchNames,
  searchVault,
  snippetOf,
  type NoteRef,
} from './search';

const VAULT =
  '/home/yogi/exploration/daily-tab/features/obsidian/fixtures/vault';
const root = await fakeDirectory(VAULT, 'obs-vault');
const notes = await listAllNotes(root);

const paths = (hits: { path: string }[]) => hits.map((hit) => hit.path);

describe('listAllNotes', () => {
  it('finds notes at every depth', async () => {
    const notes = await listAllNotes(root);

    expect(notes.map((note) => note.path).sort()).toEqual([
      'Beta.md',
      'Inbox.md',
      'alpha.md',
      'projects/Plan.md',
      'projects/archive/Old.md',
      'zeta/Z.md',
    ]);
  });

  it('skips hidden folders and hidden notes', async () => {
    const notes = await listAllNotes(root);

    expect(notes.some((note) => note.path.startsWith('.'))).toBe(false);
    expect(notes.some((note) => note.path.includes('/.'))).toBe(false);
  });

  it('skips files that are not notes', async () => {
    const notes = await listAllNotes(root);

    expect(notes.some((note) => note.path.endsWith('.canvas'))).toBe(false);
  });

  it('records each note without its extension, and its folder', async () => {
    const notes = await listAllNotes(root);
    const plan = notes.find((note) => note.path === 'projects/Plan.md');

    expect(plan).toMatchObject({
      name: 'Plan',
      folder: 'projects',
    });
  });

  it('gives a root note an empty folder', async () => {
    const notes = await listAllNotes(root);
    const alpha = notes.find((note) => note.path === 'alpha.md');

    expect(alpha?.folder).toBe('');
  });

  it('keeps the handle, so contents can be read without walking again', async () => {
    const notes = await listAllNotes(root);
    const alpha = notes.find((note) => note.path === 'alpha.md');

    await expect(alpha?.handle.getFile()).resolves.toBeInstanceOf(File);
  });
});

describe('searchNames', () => {
  it('matches a name ignoring case', () => {
    expect(paths(searchNames(notes, 'ALP'))).toEqual(['alpha.md']);
  });

  it('shows each match with its folder', () => {
    const [hit] = searchNames(notes, 'plan');

    expect(hit).toEqual({
      path: 'projects/Plan.md',
      name: 'Plan',
      folder: 'projects',
    });
  });

  it('matches anywhere in the name', () => {
    expect(paths(searchNames(notes, 'old'))).toEqual([
      'projects/archive/Old.md',
    ]);
  });

  it('puts a name that starts with the query first', () => {
    const hits = searchNames(
      [
        { ...notes[0], path: 'x-alph.md', name: 'x-alph' },
        { ...notes[0], path: 'alpha.md', name: 'alpha' },
      ],
      'alph'
    );

    expect(paths(hits)).toEqual(['alpha.md', 'x-alph.md']);
  });

  it(`shows nothing below ${MIN_QUERY} characters`, () => {
    expect(searchNames(notes, 'a')).toEqual([]);
    expect(searchNames(notes, '')).toEqual([]);
    expect(searchNames(notes, '   ')).toEqual([]);
  });

  it(`counts the trimmed query, so "${' a '.repeat(1)}" is too short`, () => {
    expect(searchNames(notes, '   a   ')).toEqual([]);
  });

  it('is empty when nothing matches', () => {
    expect(searchNames(notes, 'zzzz')).toEqual([]);
  });

  it(`caps the list at ${MAX_RESULTS} results`, () => {
    const many = Array.from({ length: MAX_RESULTS + 10 }, (_, index) => ({
      path: `note-${index}.md`,
      name: `note-${index}`,
      folder: '',
      handle: notes[0].handle,
    }));

    expect(searchNames(many, 'note')).toHaveLength(MAX_RESULTS);
  });

  it('does not search note contents', () => {
    // "Ship" appears in projects/Plan.md but in no name.
    expect(searchNames(notes, 'ship')).toEqual([]);
  });
});

describe('noteText', () => {
  /** A vault whose one note holds `text`, plus a way to change it. */
  async function makeVault(text: string) {
    const dir = await mkdtemp(join(tmpdir(), 'daily-tab-cache-'));
    await writeFile(join(dir, 'note.md'), text);
    const root = await fakeDirectory(dir, 'vault');
    const [note] = await listAllNotes(root);
    return { dir, note };
  }

  it('caches by lastModified, so an unchanged note is not read again', async () => {
    const { dir, note } = await makeVault('first');
    try {
      const cache = createTextCache();
      const file = await note.handle.getFile();
      cache.set(note.path, { modified: file.lastModified, text: 'cached' });

      expect(await noteText(note, cache)).toBe('cached');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('reads the file when there is no cached copy', async () => {
    const { dir, note } = await makeVault('first');
    try {
      expect(await noteText(note, createTextCache())).toBe('first');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('re-reads a note whose lastModified does not match', async () => {
    const { dir, note } = await makeVault('second');
    try {
      const cache = createTextCache();
      cache.set(note.path, { modified: -1, text: 'stale' });

      expect(await noteText(note, cache)).toBe('second');
      expect(cache.get(note.path)?.text).toBe('second');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('does not read a note that is not in the cache yet twice', async () => {
    const { dir, note } = await makeVault('third');
    try {
      const cache = createTextCache();
      let reads = 0;
      const counting = {
        ...note,
        handle: {
          ...note.handle,
          async getFile() {
            const file = await note.handle.getFile();
            reads += 1;
            return file;
          },
        },
      } as unknown as NoteRef;

      await noteText(counting, cache);
      await noteText(counting, cache);

      // `getFile()` needs the File to compare timestamps, but `text()` is cached.
      expect(reads).toBe(2);
      expect(cache.get(note.path)?.text).toBe('third');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe('snippetOf', () => {
  it('collapses newlines so the hit reads as one line', () => {
    expect(snippetOf('one\ntwo ship three\nfour', 'ship')).toBe(
      'one two ship three four'
    );
  });

  it('adds an ellipsis when text is cut on each side', () => {
    const text = `${'a'.repeat(200)}hit${'b'.repeat(200)}`;
    const snippet = snippetOf(text, 'hit');

    expect(snippet.startsWith('…')).toBe(true);
    expect(snippet.endsWith('…')).toBe(true);
    expect(snippet).toContain('hit');
    expect(snippet.length).toBeLessThan(text.length);
  });

  it('has no leading ellipsis when the hit is near the start', () => {
    expect(snippetOf(`hit ${'b'.repeat(200)}`, 'hit').startsWith('…')).toBe(
      false
    );
  });

  it('matches case-insensitively', () => {
    expect(snippetOf('a SHIP sails', 'ship')).toContain('SHIP');
  });

  it('falls back to the start of the note when the needle is absent', () => {
    expect(snippetOf('nothing here', 'zzz')).toBe('nothing here');
  });
});

describe('searchContents', () => {
  const cache = () => createTextCache();

  it('finds a note by its text', async () => {
    const hits = await searchContents(notes, 'ship', {
      cache: cache(),
      limit: MAX_RESULTS,
      skip: new Set(),
    });

    expect(hits.map((hit) => hit.path)).toEqual(['projects/Plan.md']);
    expect(hits[0].snippet).toContain('Ship the obsidian module');
  });

  it('skips notes already matched by name', async () => {
    const hits = await searchContents(notes, 'plan', {
      cache: cache(),
      limit: MAX_RESULTS,
      skip: new Set(['projects/Plan.md']),
    });

    expect(hits).toEqual([]);
  });

  it('honours the limit', async () => {
    const hits = await searchContents(notes, 'the', {
      cache: cache(),
      limit: 1,
      skip: new Set(),
    });

    expect(hits).toHaveLength(1);
  });

  it('shows nothing below the minimum query length', async () => {
    const hits = await searchContents(notes, 'a', {
      cache: cache(),
      limit: MAX_RESULTS,
      skip: new Set(),
    });

    expect(hits).toEqual([]);
  });

  it('does not let one unreadable note fail the search', async () => {
    const broken = {
      path: 'broken.md',
      name: 'broken',
      folder: '',
      handle: {
        kind: 'file',
        name: 'broken.md',
        async getFile() {
          throw new DOMException('gone', 'NotFoundError');
        },
      },
    } as unknown as NoteRef;

    const hits = await searchContents([broken, ...notes], 'ship', {
      cache: cache(),
      limit: MAX_RESULTS,
      skip: new Set(),
    });

    expect(hits.map((hit) => hit.path)).toEqual(['projects/Plan.md']);
  });
});

describe('searchVault', () => {
  it('puts name matches before content matches', async () => {
    const hits = await searchVault(notes, 'plan', createTextCache());

    expect(hits.map((hit) => hit.path)).toEqual(['projects/Plan.md']);
    expect(hits[0].snippet).toBeUndefined();
  });

  it('combines a name match and a content match', async () => {
    const hits = await searchVault(notes, 'inbox', createTextCache());

    expect(hits.map((hit) => hit.path)).toEqual(['Inbox.md']);
  });

  it(`never returns more than ${MAX_RESULTS} in total`, async () => {
    const many = Array.from({ length: MAX_RESULTS + 20 }, (_, index) => ({
      ...notes[0],
      path: `note-${index}.md`,
      name: `note-${index}`,
    }));

    const hits = await searchVault(many, 'note', createTextCache());

    expect(hits.length).toBeLessThanOrEqual(MAX_RESULTS);
  });
});
