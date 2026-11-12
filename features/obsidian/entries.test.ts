import { describe, expect, it } from 'vitest';
import { fakeDirectory } from './fixtures/fake-handle';
import { listFolder, parsePath, resolveFolder } from './entries';

const VAULT =
  '/home/yogi/exploration/daily-tab/features/obsidian/fixtures/vault';

const root = await fakeDirectory(VAULT, 'obs-vault');

const names = (entries: { name: string; kind: string }[] | null) =>
  entries?.map((entry) => `${entry.kind}:${entry.name}`);

describe('parsePath', () => {
  it('splits a nested path into segments', () => {
    expect(parsePath('projects/archive')).toEqual(['projects', 'archive']);
  });

  it('treats the root as no segments', () => {
    expect(parsePath('')).toEqual([]);
  });

  it('drops one trailing slash', () => {
    expect(parsePath('projects/')).toEqual(['projects']);
  });

  it.each([
    ['..', '..'],
    ['projects/../..', 'a parent segment'],
    ['/etc', 'an absolute path'],
    ['projects//archive', 'an empty segment'],
    ['.obsidian', 'a hidden folder'],
    ['projects/.hidden', 'a hidden child'],
    ['projects\\archive', 'a backslash'],
  ])('rejects %s (%s)', (path) => {
    expect(parsePath(path)).toBeNull();
  });
});

describe('resolveFolder', () => {
  it('returns the root for an empty path', async () => {
    await expect(resolveFolder(root, '')).resolves.toBe(root);
  });

  it('walks into nested folders', async () => {
    const archive = await resolveFolder(root, 'projects/archive');

    expect(archive?.name).toBe('archive');
  });

  it('refuses a note where a folder is asked for', async () => {
    await expect(resolveFolder(root, 'alpha.md')).resolves.toBeNull();
  });

  it('refuses a folder that does not exist', async () => {
    await expect(resolveFolder(root, 'nope')).resolves.toBeNull();
  });
});

describe('listFolder', () => {
  it('lists folders first, then notes, by name ignoring case', async () => {
    expect(names(await listFolder(root, ''))).toEqual([
      'folder:projects',
      'folder:zeta',
      'note:alpha',
      'note:Beta',
      'note:Inbox',
    ]);
  });

  it('gives each entry its path from the vault root', async () => {
    const entries = await listFolder(root, 'projects');

    expect(entries?.map((entry) => entry.path)).toEqual([
      'projects/archive',
      'projects/Plan.md',
    ]);
  });

  it('shows a note without its .md', async () => {
    const entries = await listFolder(root, 'projects');
    const plan = entries?.find((entry) => entry.kind === 'note');

    expect(plan?.name).toBe('Plan');
  });

  it('leaves out hidden names and files that are not notes', async () => {
    const listed = names(await listFolder(root, ''));

    expect(listed).not.toContain('folder:.obsidian');
    expect(listed).not.toContain('folder:.trash');
    expect(listed).not.toContain('note:.hidden');
    expect(listed).not.toContain('note:diagram');
  });

  it('lists a nested folder with paths relative to the root', async () => {
    expect(names(await listFolder(root, 'zeta'))).toEqual(['note:Z']);
  });

  it('lists the only note in a nested folder with its full path', async () => {
    expect(await listFolder(root, 'projects/archive')).toEqual([
      { kind: 'note', name: 'Old', path: 'projects/archive/Old.md' },
    ]);
  });

  it('is null for anything that is not a folder in the vault', async () => {
    await expect(listFolder(root, 'alpha.md')).resolves.toBeNull();
    await expect(listFolder(root, 'nope')).resolves.toBeNull();
    await expect(listFolder(root, '../..')).resolves.toBeNull();
    await expect(listFolder(root, '.obsidian')).resolves.toBeNull();
  });
});
