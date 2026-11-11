export type Entry = {
  kind: 'folder' | 'note';
  /** Shown to the owner: a note without its `.md`. */
  name: string;
  /** From the vault root, with `/`, as used in `?folder=` and `?note=`. */
  path: string;
};
