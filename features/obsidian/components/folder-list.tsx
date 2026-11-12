import { ChevronRight, FileText, Folder } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { listFolder, type Entry } from '../entries';
import { obsidianHref } from '../href';

const ROW =
  'flex min-h-9 min-w-0 items-center gap-2 rounded-sm px-2 text-sm outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring';

export function FolderList({
  entries,
  selectedPath,
  currentFolder = '',
  root,
  loading = false,
  invalid = false,
}: {
  entries: Entry[];
  selectedPath?: string | null;
  currentFolder?: string;
  root: FileSystemDirectoryHandle;
  loading?: boolean;
  invalid?: boolean;
}) {
  if (loading)
    return (
      <p className="px-2 py-2 text-xs text-muted-foreground">Reading folder…</p>
    );
  if (invalid)
    return (
      <p role="alert" className="px-2 py-2 text-xs text-muted-foreground">
        Folder is no longer available.
      </p>
    );
  if (entries.length === 0) {
    return (
      <p className="px-2 py-3 text-sm text-muted-foreground">
        This folder is empty.
      </p>
    );
  }

  return (
    <nav aria-label="Vault files">
      <ul className="flex flex-col">
        {entries.map((entry) => (
          <li key={entry.path}>
            {entry.kind === 'folder' ? (
              <Collapsible
                defaultOpen={isFolderOpen(
                  entry.path,
                  currentFolder,
                  selectedPath
                )}
              >
                <div className="group flex min-w-0 items-center">
                  <CollapsibleTrigger
                    aria-label={`${entry.name} folder contents`}
                    className="flex size-9 shrink-0 items-center justify-center rounded-sm outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <ChevronRight
                      aria-hidden
                      className="size-4 transition-transform group-data-panel-open:rotate-90"
                    />
                  </CollapsibleTrigger>
                  <Link
                    href={obsidianHref({ folder: entry.path })}
                    className={`${ROW} flex-1`}
                  >
                    <Folder
                      aria-hidden
                      className="size-4 shrink-0 text-muted-foreground"
                    />
                    <span className="truncate">{entry.name}</span>
                  </Link>
                </div>
                <CollapsibleContent>
                  <div className="ml-4 border-l border-border pl-1">
                    <NestedFolder
                      path={entry.path}
                      selectedPath={selectedPath}
                      currentFolder={currentFolder}
                      root={root}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <Link
                href={obsidianHref({ note: entry.path })}
                className={`${ROW} ${selectedPath === entry.path ? 'bg-muted font-medium text-foreground' : ''}`}
                aria-current={selectedPath === entry.path ? 'page' : undefined}
              >
                <FileText
                  aria-hidden
                  className="size-4 shrink-0 text-muted-foreground"
                />
                <span className="truncate">{entry.name}</span>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

function isFolderOpen(
  path: string,
  currentFolder: string,
  selectedPath?: string | null
) {
  return (
    currentFolder === path ||
    currentFolder.startsWith(`${path}/`) ||
    Boolean(selectedPath?.startsWith(`${path}/`))
  );
}

function NestedFolder({
  path,
  selectedPath,
  currentFolder,
  root,
}: {
  path: string;
  selectedPath?: string | null;
  currentFolder: string;
  root: FileSystemDirectoryHandle;
}) {
  const [result, setResult] = useState<
    | { entries: Entry[]; invalid: false }
    | { entries: null; invalid: true }
    | null
  >(null);

  useEffect(() => {
    let active = true;
    listFolder(root, path)
      .then((result) => {
        if (!active) return;
        setResult(
          result === null
            ? { entries: null, invalid: true }
            : { entries: result, invalid: false }
        );
      })
      .catch(() => {
        if (active) setResult({ entries: null, invalid: true });
      });
    return () => {
      active = false;
    };
  }, [root, path]);

  return (
    <FolderList
      entries={result?.entries ?? []}
      selectedPath={selectedPath}
      currentFolder={currentFolder}
      root={root}
      loading={result === null}
      invalid={result?.invalid ?? false}
    />
  );
}
