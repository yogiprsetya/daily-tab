import 'server-only';
import { readdir, realpath, stat } from 'node:fs/promises';
import { join, relative as relativePath, sep } from 'node:path';

export type Vault =
  { status: 'off' } | { status: 'missing' } | { status: 'ready'; root: string };

export type Entry = {
  kind: 'folder' | 'note';
  /** Shown to the owner: a note without its `.md`. */
  name: string;
  /** From the vault root, with `/`, as used in `?folder=` and `?note=`. */
  path: string;
};

type Kind = Entry['kind'];

const NOTE = /\.md$/i;
const isHidden = (name: string) => name.startsWith('.');

/** Checks the configured folder. Callers never learn why it is missing, so the path cannot leak. */
export async function openVault(path: string | undefined): Promise<Vault> {
  if (!path) return { status: 'off' };
  try {
    const root = await realpath(path);
    if ((await stat(root)).isDirectory()) return { status: 'ready', root };
  } catch {
    // Missing or unreadable: both are reported as missing.
  }
  return { status: 'missing' };
}

/**
 * The real path of `relative` inside the vault, or null when it would leave
 * the vault, names anything hidden, or is not a folder or `.md` note as asked.
 * Every path from a URL goes through here before any file is read.
 */
export async function resolveInVault(
  root: string,
  relative: string,
  kind: Kind
): Promise<string | null> {
  if (/[\\\0]/.test(relative)) return null;

  const trimmed = relative.endsWith('/') ? relative.slice(0, -1) : relative;
  const segments = trimmed === '' ? [] : trimmed.split('/');
  if (segments.some((s) => s === '' || s === '..' || isHidden(s))) return null;

  let real: string;
  try {
    real = await realpath(join(root, ...segments));
  } catch {
    return null;
  }

  // A symlink can lead anywhere: judge where it ended up, not what was asked.
  const inside = relativePath(root, real);
  if (inside.startsWith('..') || inside.split(sep).some(isHidden)) return null;

  const info = await stat(real);
  if (kind === 'folder') return info.isDirectory() ? real : null;
  return info.isFile() && NOTE.test(real) ? real : null;
}

/** Folders first, then notes, each by name ignoring case. Hidden names and other files are left out. */
export async function listFolder(
  root: string,
  folder: string
): Promise<Entry[]> {
  const base = relativePath(root, folder);
  const entries: Entry[] = [];

  for (const dirent of await readdir(folder, { withFileTypes: true })) {
    if (isHidden(dirent.name)) continue;
    const path = base
      ? `${base.split(sep).join('/')}/${dirent.name}`
      : dirent.name;

    let kind: Kind | null = null;
    if (dirent.isDirectory()) kind = 'folder';
    else if (dirent.isFile() && NOTE.test(dirent.name)) kind = 'note';
    else if (dirent.isSymbolicLink()) {
      if (await resolveInVault(root, path, 'folder')) kind = 'folder';
      else if (await resolveInVault(root, path, 'note')) kind = 'note';
    }
    if (!kind) continue;

    entries.push({
      kind,
      name: kind === 'note' ? dirent.name.replace(NOTE, '') : dirent.name,
      path,
    });
  }

  return entries.sort(
    (a, b) =>
      Number(a.kind === 'note') - Number(b.kind === 'note') ||
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  );
}
