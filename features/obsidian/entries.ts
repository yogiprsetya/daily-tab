export type Entry = {
  kind: 'folder' | 'note';
  /** Shown to the owner: a note without its `.md`. */
  name: string;
  /** From the vault root, with `/`, as used in `?folder=` and `?note=`. */
  path: string;
};

const NOTE = /\.md$/i;
const isHidden = (name: string) => name.startsWith('.');

/**
 * The segments of a path from the vault root, or null for anything that should
 * not be looked up: a backslash, a `..`, an empty segment or a hidden name. The
 * browser keeps a handle inside the picked folder, so this rejects confusing
 * shapes rather than dangerous ones.
 */
export function parsePath(relative: string): string[] | null {
  if (/[\\\0]/.test(relative)) return null;

  const trimmed = relative.endsWith('/') ? relative.slice(0, -1) : relative;
  if (trimmed === '') return [];

  const segments = trimmed.split('/');
  if (segments.some((s) => s === '' || s === '..' || isHidden(s))) return null;
  return segments;
}

/** Walks `relative` from the vault root, or null when it is not a folder there. */
export async function resolveFolder(
  root: FileSystemDirectoryHandle,
  relative: string
): Promise<FileSystemDirectoryHandle | null> {
  const segments = parsePath(relative);
  if (!segments) return null;

  let dir = root;
  for (const segment of segments) {
    try {
      dir = await dir.getDirectoryHandle(segment);
    } catch {
      // NotFoundError or TypeMismatchError: no such folder, or it is a file.
      return null;
    }
  }
  return dir;
}

/**
 * Folders first, then notes, each by name ignoring case. Hidden names and other
 * file types are left out. Null means `relative` is not a folder in the vault.
 */
export async function listFolder(
  root: FileSystemDirectoryHandle,
  relative: string
): Promise<Entry[] | null> {
  const segments = parsePath(relative);
  if (!segments) return null;

  const dir = await resolveFolder(root, relative);
  if (!dir) return null;

  const entries: Entry[] = [];
  for await (const [name, child] of dir.entries()) {
    if (isHidden(name)) continue;

    let kind: Entry['kind'];
    if (child.kind === 'directory') kind = 'folder';
    else if (child.kind === 'file' && NOTE.test(name)) kind = 'note';
    else continue;

    entries.push({
      kind,
      name: kind === 'note' ? name.replace(NOTE, '') : name,
      path: [...segments, name].join('/'),
    });
  }

  return entries.sort(
    (a, b) =>
      Number(a.kind === 'note') - Number(b.kind === 'note') ||
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  );
}
