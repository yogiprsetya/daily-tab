import { FilterLink } from '@/components/grouping/filter-link';
import { FilterNav } from '@/components/grouping/filter-nav';
import { GroupManager } from '@/components/grouping/group-manager';
import { ButtonGroup } from '@/components/ui/button-group';
import { requirePageSession } from '@/features/auth/require-session';
import {
  countBookmarks,
  countWithoutFolder,
  listBookmarks,
  listFolders,
  resolveFolderFilter,
} from '../dal';
import { parseFolderFilter, parseSearch } from '../validation';
import { AddBookmarkButton } from './add-bookmark-button';
import { BookmarkList } from './bookmark-list';
import { BookmarkSearch } from './bookmark-search';

const FOLDER_COPY = {
  trigger: 'Manage folders',
  title: 'Folders',
  description: 'Deleting a folder keeps its bookmarks; they move to No folder.',
  placeholder: 'New folder',
  newNameLabel: 'New folder name',
};

function filterHref(folder: string | null, query: string | undefined) {
  const params = new URLSearchParams();
  if (folder) params.set('folder', folder);
  if (query) params.set('q', query);
  const search = params.toString();
  return search ? `/bookmarks?${search}` : '/bookmarks';
}

/** Reads the session, URL and database: render inside <Suspense>. */
export async function BookmarksView({
  searchParams,
}: {
  searchParams: Promise<{
    folder?: string | string[];
    q?: string | string[];
  }>;
}) {
  await requirePageSession();
  const params = await searchParams;
  const filter = await resolveFolderFilter(parseFolderFilter(params.folder));
  const query = parseSearch(params.q);

  const [rows, folders, total, withoutFolder] = await Promise.all([
    listBookmarks(filter, query),
    listFolders(),
    countBookmarks(),
    countWithoutFolder(),
  ]);

  const folderOptions = folders.map(({ id, name }) => ({ id, name }));
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
            <ButtonGroup className="[&>[data-slot]:first-child]:rounded-l-lg [&>[data-slot]:last-child]:rounded-r-lg">
              <FilterLink
                href={filterHref(null, query)}
                label="All"
                count={total}
                active={filter.kind === 'all'}
              />
              {folders.map((folder) => (
                <FilterLink
                  key={folder.id}
                  href={filterHref(folder.id, query)}
                  label={folder.name}
                  count={folder.bookmarkCount}
                  active={activeFolderId === folder.id}
                />
              ))}
              <FilterLink
                href={filterHref('none', query)}
                label="No folder"
                count={withoutFolder}
                active={filter.kind === 'none'}
              />
            </ButtonGroup>
          </FilterNav>
          <AddBookmarkButton
            folders={folderOptions}
            defaultFolderId={activeFolderId}
          />
        </div>
        <GroupManager
          endpoint="/api/bookmark-folders"
          groups={folderOptions}
          copy={FOLDER_COPY}
        />
      </div>

      <BookmarkSearch initialQuery={query ?? ''} folderParam={folderParam} />

      <BookmarkList
        bookmarks={rows.map(
          ({ id, title, url, notes, folderId, folderName }) => ({
            id,
            title,
            url,
            notes,
            folderId,
            folderName,
          })
        )}
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
