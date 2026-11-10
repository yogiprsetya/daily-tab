import { FileText, Folder } from 'lucide-react';
import Link from 'next/link';
import { obsidianHref } from '../href';
import type { Entry } from '../vault';

const ROW =
  'flex min-h-11 min-w-0 items-center gap-3 rounded-lg px-2 text-sm outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring';

export function FolderList({ entries }: { entries: Entry[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">This folder is empty.</p>
    );
  }

  return (
    <ul className="flex flex-col">
      {entries.map((entry) => {
        const Icon = entry.kind === 'folder' ? Folder : FileText;
        return (
          <li key={entry.path}>
            <Link
              href={obsidianHref(
                entry.kind === 'folder'
                  ? { folder: entry.path }
                  : { note: entry.path }
              )}
              className={ROW}
            >
              <Icon
                aria-hidden
                className="size-4 shrink-0 text-muted-foreground"
              />
              <span className="truncate">{entry.name}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
