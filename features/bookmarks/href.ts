/** The bookmarks page URL for a `?folder=` value and search text, either optional. */
export function bookmarksHref(
  folder: string | null,
  query: string | undefined
): string {
  const params = new URLSearchParams();
  if (folder) params.set('folder', folder);
  if (query) params.set('q', query);
  const search = params.toString();
  return search ? `/bookmarks?${search}` : '/bookmarks';
}
