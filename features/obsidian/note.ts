import { parsePath } from './entries';

/** A note over this size is not read: one huge file should not freeze the tab. */
export const MAX_NOTE_BYTES = 1024 * 1024;

export type Note =
  | { status: 'missing' }
  | { status: 'too-large' }
  | { status: 'ready'; text: string };

/**
 * `?note=` is a path from the vault root ending in `.md`. Unlike a folder path
 * it must name a file, so the last segment is checked before any handle is asked.
 */
export function parseNotePath(relative: string): string[] | null {
  const segments = parsePath(relative);
  if (!segments || segments.length === 0) return null;
  return /\.md$/i.test(segments[segments.length - 1]) ? segments : null;
}

/** Walks to the note and returns its handle, or null when it is not a note. */
export async function resolveNote(
  root: FileSystemDirectoryHandle,
  relative: string
): Promise<FileSystemFileHandle | null> {
  const segments = parseNotePath(relative);
  if (!segments) return null;

  let dir = root;
  for (const segment of segments.slice(0, -1)) {
    try {
      dir = await dir.getDirectoryHandle(segment);
    } catch {
      return null;
    }
  }

  const name = segments[segments.length - 1];
  try {
    return await dir.getFileHandle(name);
  } catch {
    // NotFoundError, or TypeMismatchError when a folder has that name.
    return null;
  }
}

/** Reads a note as text, refusing anything that is not a `.md` file under 1 MB. */
export async function readNote(
  root: FileSystemDirectoryHandle,
  relative: string
): Promise<Note> {
  const handle = await resolveNote(root, relative);
  if (!handle) return { status: 'missing' };

  const file = await handle.getFile();
  if (file.size > MAX_NOTE_BYTES) return { status: 'too-large' };

  return { status: 'ready', text: await file.text() };
}

/**
 * Drops a YAML frontmatter block, which Obsidian uses for properties the page
 * does not show. Only a leading `---` line counts, as in Obsidian.
 */
export function stripFrontmatter(text: string): string {
  const match = text.match(
    /^---[ \t]*\r?\n(?:[\s\S]*?\r?\n)?---[ \t]*(?:\r?\n|$)/
  );
  return match ? text.slice(match[0].length) : text;
}
