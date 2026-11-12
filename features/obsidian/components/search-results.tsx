'use client';

import { FileText, Folder } from 'lucide-react';
import Link from 'next/link';
import { obsidianHref } from '../href';
import type { Result } from '../search-client';

const ROW =
  'flex min-h-11 min-w-0 flex-col gap-0.5 rounded-lg px-2 py-1.5 text-sm outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring';

/** Search results: each shows its folder, and a snippet when only the text matched. */
export function SearchResults({ hits }: { hits: Result[] }) {
  if (hits.length === 0) {
    return <p className="text-sm text-muted-foreground">No notes match.</p>;
  }

  return (
    <ul className="flex flex-col">
      {hits.map((hit) => (
        <li key={hit.path}>
          <Link href={obsidianHref({ note: hit.path })} className={ROW}>
            <span className="flex min-w-0 items-center gap-3">
              <FileText
                aria-hidden
                className="size-4 shrink-0 text-muted-foreground"
              />
              <span className="truncate font-medium">{hit.name}</span>
              {hit.folder && (
                <span className="ml-auto flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
                  <Folder aria-hidden className="size-3 shrink-0" />
                  <span className="truncate">{hit.folder}</span>
                </span>
              )}
            </span>
            {hit.snippet && (
              <span className="pl-7 text-xs wrap-break-word text-muted-foreground">
                {hit.snippet}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
