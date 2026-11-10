import { mkdtemp, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { openVault } from './vault';

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
