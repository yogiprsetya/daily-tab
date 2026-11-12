'use client';

import { Pencil } from 'lucide-react';
import { useState } from 'react';
import { ICON_BUTTON } from '@/components/form-styles';
import { SiteIcon } from '@/components/site-icon';
import { displayHost } from '@/lib/url';
import { useBookmarksInvalidate } from '../hooks';
import { BookmarkDialog } from './bookmark-dialog';
import type { BookmarkItem, FolderOption } from './types';

function BookmarkRow({
  bookmark,
  showFolder,
  onEdit,
}: {
  bookmark: BookmarkItem;
  showFolder: boolean;
  onEdit: () => void;
}) {
  const host = displayHost(bookmark.url);
  const meta =
    showFolder && bookmark.folderName
      ? `${host} · ${bookmark.folderName}`
      : host;

  return (
    <li className="flex min-w-0 items-center gap-3 py-1.5">
      <SiteIcon title={bookmark.title} url={bookmark.url} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <a
          href={bookmark.url}
          target="_blank"
          rel="noreferrer"
          className="truncate rounded text-sm font-medium underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          {bookmark.title}
        </a>
        <p className="truncate text-xs text-muted-foreground">{meta}</p>
        {bookmark.notes && (
          <p className="line-clamp-2 text-xs wrap-anywhere whitespace-pre-line text-muted-foreground">
            {bookmark.notes}
          </p>
        )}
      </div>
      <button
        type="button"
        aria-label={`Edit ${bookmark.title}`}
        onClick={onEdit}
        className={ICON_BUTTON}
      >
        <Pencil aria-hidden className="size-4" />
      </button>
    </li>
  );
}

export function BookmarkList({
  bookmarks,
  folders,
  showFolder,
  emptyLabel,
}: {
  bookmarks: BookmarkItem[];
  folders: FolderOption[];
  showFolder: boolean;
  emptyLabel: string;
}) {
  const invalidate = useBookmarksInvalidate();
  const [editing, setEditing] = useState<BookmarkItem | null>(null);

  if (bookmarks.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <>
      <ul className="flex flex-col">
        {bookmarks.map((bookmark) => (
          <BookmarkRow
            key={bookmark.id}
            bookmark={bookmark}
            showFolder={showFolder}
            onEdit={() => setEditing(bookmark)}
          />
        ))}
      </ul>

      {editing && (
        <BookmarkDialog
          key={editing.id}
          bookmark={editing}
          folders={folders}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            invalidate();
          }}
        />
      )}
    </>
  );
}
