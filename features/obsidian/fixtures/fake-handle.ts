import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * A `FileSystemDirectoryHandle` backed by a real folder, for tests. The browser
 * API cannot run on Node, but the code under test only uses `kind`, `name`,
 * `entries()`, `getDirectoryHandle()`, `getFileHandle()` and `getFile()`, so a
 * plain object is enough and the fixture tree is still read from disk rather
 * than described twice. Children are built on demand, so a note's contents are
 * read only when the code under test asks for them.
 */
export async function fakeDirectory(
  path: string,
  name = path.split('/').pop() ?? ''
): Promise<FileSystemDirectoryHandle> {
  const children = new Map<string, FileSystemHandle>();

  for (const dirent of await readdir(path, { withFileTypes: true })) {
    children.set(
      dirent.name,
      dirent.isDirectory()
        ? await fakeDirectory(join(path, dirent.name), dirent.name)
        : fakeFile(join(path, dirent.name), dirent.name)
    );
  }

  return {
    kind: 'directory',
    name,
    async *entries() {
      for (const entry of children) yield entry;
    },
    async getDirectoryHandle(child: string) {
      const found = children.get(child);
      if (found?.kind !== 'directory') {
        throw new DOMException('not a directory', 'NotFoundError');
      }
      return found;
    },
    async getFileHandle(child: string) {
      const found = children.get(child);
      if (found?.kind !== 'file') {
        throw new DOMException('not a file', 'NotFoundError');
      }
      return found;
    },
  } as unknown as FileSystemDirectoryHandle;
}

function fakeFile(path: string, name: string): FileSystemFileHandle {
  return {
    kind: 'file',
    name,
    async getFile() {
      const [contents, info] = await Promise.all([readFile(path), stat(path)]);
      return new File([contents], name, { lastModified: info.mtimeMs });
    },
  } as unknown as FileSystemFileHandle;
}
