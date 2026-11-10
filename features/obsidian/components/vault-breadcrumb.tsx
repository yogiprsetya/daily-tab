import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { obsidianHref } from '../href';

const CRUMB = 'flex min-h-11 min-w-0 items-center rounded-lg px-1';
const LINK = `${CRUMB} text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring`;

/**
 * `folder` is a path from the vault root, with `/`. `note` names the open
 * note, if any. The last crumb is the current page and is not a link.
 */
export function VaultBreadcrumb({
  folder,
  note,
}: {
  folder: string;
  note?: string;
}) {
  const segments = folder ? folder.split('/') : [];
  const crumbs = [
    { label: 'Vault', href: obsidianHref({}) },
    ...segments.map((segment, index) => ({
      label: segment,
      href: obsidianHref({ folder: segments.slice(0, index + 1).join('/') }),
    })),
    ...(note ? [{ label: note, href: '' }] : []),
  ];

  return (
    <nav aria-label="Folder" className="min-w-0">
      <ol className="flex flex-wrap items-center gap-x-1 text-sm">
        {crumbs.map((crumb, index) => {
          const current = index === crumbs.length - 1;
          return (
            <li key={index} className="flex min-w-0 items-center gap-x-1">
              {index > 0 && (
                <ChevronRight
                  aria-hidden
                  className="size-3.5 shrink-0 text-muted-foreground"
                />
              )}
              {current ? (
                <span aria-current="page" className={`${CRUMB} font-medium`}>
                  <span className="truncate">{crumb.label}</span>
                </span>
              ) : (
                <Link href={crumb.href} className={LINK}>
                  <span className="truncate">{crumb.label}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
