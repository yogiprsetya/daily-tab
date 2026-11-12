import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { fakeDirectory } from './fixtures/fake-handle';
import {
  MAX_NOTE_BYTES,
  parseNotePath,
  readNote,
  stripFrontmatter,
} from './note';

const VAULT =
  '/home/yogi/exploration/daily-tab/features/obsidian/fixtures/vault';
const root = await fakeDirectory(VAULT, 'obs-vault');

describe('parseNotePath', () => {
  it('accepts a note at the root', () => {
    expect(parseNotePath('alpha.md')).toEqual(['alpha.md']);
  });

  it('accepts a nested note', () => {
    expect(parseNotePath('projects/Plan.md')).toEqual(['projects', 'Plan.md']);
  });

  it('accepts an uppercase extension', () => {
    expect(parseNotePath('zeta/Z.MD')).toEqual(['zeta', 'Z.MD']);
  });

  it.each([
    ['', 'the root'],
    ['projects', 'a folder'],
    ['projects/Plan', 'no extension'],
    ['projects/Plan.txt', 'another extension'],
    ['../secret.md', 'a parent segment'],
    ['.hidden.md', 'a hidden note'],
    ['projects//Plan.md', 'an empty segment'],
    ['projects\\Plan.md', 'a backslash'],
  ])('rejects %s (%s)', (path) => {
    expect(parseNotePath(path)).toBeNull();
  });
});

describe('readNote', () => {
  it('returns the text of a note', async () => {
    const note = await readNote(root, 'alpha.md');

    expect(note).toEqual({ status: 'ready', text: '# Alpha\n' });
  });

  it('returns the note under its full path', async () => {
    const note = await readNote(root, 'projects/Plan.md');

    expect(note.status).toBe('ready');
    expect(note.status === 'ready' && note.text).toContain('Ship the obsidian');
  });

  it('is missing for a folder', async () => {
    await expect(readNote(root, 'projects')).resolves.toEqual({
      status: 'missing',
    });
  });

  it('is missing for a note that does not exist', async () => {
    await expect(readNote(root, 'nope.md')).resolves.toEqual({
      status: 'missing',
    });
  });

  it('is missing when a parent folder does not exist', async () => {
    await expect(readNote(root, 'nope/Plan.md')).resolves.toEqual({
      status: 'missing',
    });
  });

  it('is missing for a file that is not a note', async () => {
    await expect(readNote(root, 'diagram.canvas')).resolves.toEqual({
      status: 'missing',
    });
  });

  it('refuses a note just over the limit and accepts one just under it', async () => {
    // A throwaway folder: writing into the fixture tree would change what the
    // other tests see, since they read it once at import time.
    const dirPath = await mkdtemp(join(tmpdir(), 'daily-tab-note-'));
    const tooLarge = 'a'.repeat(MAX_NOTE_BYTES + 1);
    const atLimit = 'b'.repeat(MAX_NOTE_BYTES);

    try {
      await writeFile(join(dirPath, 'large.md'), tooLarge);
      await writeFile(join(dirPath, 'limit.md'), atLimit);
      const dir = await fakeDirectory(dirPath, 'vault');

      await expect(readNote(dir, 'large.md')).resolves.toEqual({
        status: 'too-large',
      });
      await expect(readNote(dir, 'limit.md')).resolves.toEqual({
        status: 'ready',
        text: atLimit,
      });
    } finally {
      await rm(dirPath, { recursive: true, force: true });
    }
  });
});

describe('stripFrontmatter', () => {
  it('drops a leading block', () => {
    expect(stripFrontmatter('---\ntags: [x]\n---\n\n# Title\n')).toBe(
      '\n# Title\n'
    );
  });

  it('leaves a note without frontmatter alone', () => {
    expect(stripFrontmatter('# Title\n')).toBe('# Title\n');
  });

  it('leaves a later block alone', () => {
    const text = '# Title\n\n---\ntags: [x]\n---\n';
    expect(stripFrontmatter(text)).toBe(text);
  });

  it('leaves an unterminated block alone', () => {
    const text = '---\ntags: [x]\n# Title\n';
    expect(stripFrontmatter(text)).toBe(text);
  });

  it('handles CRLF line endings', () => {
    expect(stripFrontmatter('---\r\ntags: [x]\r\n---\r\n\r\n# Title\r\n')).toBe(
      '\r\n# Title\r\n'
    );
  });

  it('drops an empty block', () => {
    expect(stripFrontmatter('---\n---\n# Title\n')).toBe('# Title\n');
  });
});
