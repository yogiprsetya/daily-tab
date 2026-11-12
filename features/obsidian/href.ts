/** The Obsidian page URL for one of a folder, a note or a search; nothing means the vault root. */
export function obsidianHref({
  folder,
  note,
  q,
}: {
  folder?: string;
  note?: string;
  q?: string;
}): string {
  const params = new URLSearchParams();
  if (folder) params.set('folder', folder);
  if (note) params.set('note', note);
  if (q) params.set('q', q);
  const search = params.toString();
  return search ? `/obsidian?${search}` : '/obsidian';
}
