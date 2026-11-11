'use client';

import { useSearchParams } from 'next/navigation';
import { FilterLink } from '@/components/grouping/filter-link';
import { FilterNav } from '@/components/grouping/filter-nav';
import { GroupManager } from '@/components/grouping/group-manager';
import { LoadError } from '@/components/load-error';
import { useBookmarks, useFolders } from '../hooks';
import { bookmarksHref } from '../href';
import { parseFolderFilter, parseSearch } from '../validation';
import { AddBookmarkButton } from './add-bookmark-button';
import { BookmarkList } from './bookmark-list';
import { BookmarkSearch } from './bookmark-search';
import { BookmarksSkeleton } from './bookmarks-skeleton';

const FOLDER_COPY = {
  trigger: 'Manage folders',
  title: 'Folders',
  description: 'Deleting a folder keeps its bookmarks; they move to No folder.',
  placeholder: 'New folder',
  newNameLabel: 'New folder name',
};

/** Client-rendered: the page only gates the session, the data comes from SWR. */
export function BookmarksView() {
  const params = useSearchParams();
  const requested = parseFolderFilter(params.get('folder') ?? undefined);
  const query = parseSearch(params.get('q') ?? undefined);
  const bookmarks = useBookmarks(requested, query);
  const folders = useFolders();

  if (bookmarks.error) return <LoadError message={bookmarks.error.message} />;
  if (folders.error) return <LoadError message={folders.error.message} />;
  if (!bookmarks.data || !folders.data) return <BookmarksSkeleton />;

  // The server resolves an unknown folder to All; its answer wins.
  const filter = bookmarks.data.filter;
  const folderOptions = folders.data.items.map(({ id, name }) => ({
    id,
    name,
  }));
  const activeFolderId = filter.kind === 'folder' ? filter.id : null;
  const folderParam = filter.kind === 'all' ? null : (activeFolderId ?? 'none');

  return (
    <>
      <div className="flex flex-col items-start gap-1">
        <div className="flex w-full items-start justify-between gap-3">
          <FilterNav
            label="Filter by folder"
            activeKey={activeFolderId ?? filter.kind}
          >
            <FilterLink
              href={bookmarksHref(null, query)}
              label="All"
              count={folders.data.total}
              active={filter.kind === 'all'}
            />
            {folders.data.items.map((folder) => (
              <FilterLink
                key={folder.id}
                href={bookmarksHref(folder.id, query)}
                label={folder.name}
                count={folder.bookmarkCount}
                active={activeFolderId === folder.id}
              />
            ))}
            <FilterLink
              href={bookmarksHref('none', query)}
              label="No folder"
              count={folders.data.withoutFolder}
              active={filter.kind === 'none'}
            />
          </FilterNav>
          <AddBookmarkButton
            folders={folderOptions}
            defaultFolderId={activeFolderId}
          />
        </div>
        <GroupManager
          feature="bookmark-folders"
          itemFeature="bookmarks"
          endpoint="/api/bookmark-folders"
          groups={folderOptions}
          copy={FOLDER_COPY}
        />
      </div>

      <BookmarkSearch initialQuery={query ?? ''} folderParam={folderParam} />

      <BookmarkList
        bookmarks={bookmarks.data.items}
        folders={folderOptions}
        showFolder={filter.kind === 'all'}
        emptyLabel={
          query || filter.kind !== 'all'
            ? 'No bookmarks match.'
            : 'No bookmarks yet.'
        }
      />
    </>
  );
}
