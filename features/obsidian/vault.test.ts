import { mkdtemp, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { listFolder, openVault, resolveInVault } from './vault';

let dir: string;

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'vault-open-'));
  await writeFile(join(dir, 'note.md'), '# Note');
  await symlink(dir, join(dir, '..', `${dir.split('/').pop()}-link`));
});

afterAll(async () => {
  await rm(`${dir}-link`, { force: true });
  await rm(dir, { recursive: true, force: true });
});

describe('openVault', () => {
  it('is off when no path is configured', async () => {
    expect(await openVault(undefined)).toEqual({ status: 'off' });
  });

  it('is missing when the folder does not exist', async () => {
    expect(await openVault(join(dir, 'nope'))).toEqual({ status: 'missing' });
  });

  it('is missing when the path is a file', async () => {
    expect(await openVault(join(dir, 'note.md'))).toEqual({
      status: 'missing',
    });
  });

  it('is ready with the real path of the folder', async () => {
    expect(await openVault(`${dir}-link`)).toEqual({
      status: 'ready',
      root: await realpath(dir),
    });
  });
});

const FIXTURE = join(__dirname, 'fixtures', 'vault');
let root: string;

beforeAll(async () => {
  const vault = await openVault(FIXTURE);
  if (vault.status !== 'ready') throw new Error('fixture vault missing');
  root = vault.root;
});

describe('fixture vault', () => {
  it('has live links that lead out, so the refusals below are real', async () => {
    for (const link of ['outside', 'outside-note.md']) {
      const target = await realpath(join(FIXTURE, link));
      expect(target.startsWith(`${root}/`), link).toBe(false);
    }
  });
});

describe('listFolder', () => {
  it('lists folders first, then notes, by name ignoring case', async () => {
    const entries = await listFolder(root, root);

    expect(entries.map((e) => [e.kind, e.name])).toEqual([
      ['folder', 'projects'],
      ['folder', 'zeta'],
      ['note', 'alpha'],
      ['note', 'Beta'],
      ['note', 'Inbox'],
      ['note', 'link-to-plan'],
    ]);
  });

  it('gives each entry its path from the vault root', async () => {
    const projects = await resolveInVault(root, 'projects', 'folder');

    expect(await listFolder(root, projects!)).toEqual([
      { kind: 'folder', name: 'archive', path: 'projects/archive' },
      { kind: 'note', name: 'Plan', path: 'projects/Plan.md' },
    ]);
  });

  it('leaves out hidden names, other file types and links that lead out', async () => {
    const names = (await listFolder(root, root)).map((e) => e.name);

    for (const hidden of [
      '.obsidian',
      '.trash',
      '.hidden',
      'diagram',
      'outside',
      'outside-note',
    ]) {
      expect(names).not.toContain(hidden);
    }
  });
});

describe('resolveInVault', () => {
  it.each([
    ['', 'folder'],
    ['projects', 'folder'],
    ['projects/', 'folder'],
    ['projects/archive', 'folder'],
    ['Inbox.md', 'note'],
    ['projects/Plan.md', 'note'],
    ['link-to-plan.md', 'note'],
  ] as const)('resolves %j as a %s', async (relative, kind) => {
    expect(await resolveInVault(root, relative, kind)).not.toBeNull();
  });

  it('returns the real path, so a link inside the vault resolves to its target', async () => {
    expect(await resolveInVault(root, 'link-to-plan.md', 'note')).toBe(
      join(root, 'projects', 'Plan.md')
    );
  });

  it.each([
    ['..', 'folder'],
    ['../elsewhere/secret.md', 'note'],
    ['projects/../../elsewhere/secret.md', 'note'],
    ['projects/../Inbox.md', 'note'],
    ['./Inbox.md', 'note'],
    ['/etc/passwd', 'note'],
    ['//etc', 'folder'],
    ['projects//Plan.md', 'note'],
    ['projects\\Plan.md', 'note'],
    ['Inbox.md\0', 'note'],
    ['%2e%2e/secret.md', 'note'],
    ['outside', 'folder'],
    ['outside/secret.md', 'note'],
    ['outside-note.md', 'note'],
    ['.obsidian', 'folder'],
    ['.obsidian/app.json', 'note'],
    ['.trash/deleted.md', 'note'],
    ['.hidden.md', 'note'],
    ['diagram.canvas', 'note'],
    ['projects', 'note'],
    ['Inbox.md', 'folder'],
    ['Inbox', 'note'],
    ['nope.md', 'note'],
  ] as const)('refuses %j as a %s', async (relative, kind) => {
    expect(await resolveInVault(root, relative, kind)).toBeNull();
  });
});
