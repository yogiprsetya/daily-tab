'use client';

import Link from 'next/link';
import { LoadError } from '@/components/load-error';
import { SiteIcon } from '@/components/site-icon';
import { useBookmarks } from '@/features/bookmarks/hooks';
import { parseFolderFilter } from '@/features/bookmarks/validation';
import { useReadingItems } from '@/features/reading-list/hooks';
import { splitReading } from '@/features/reading-list/optimistic';
import { parseTopicFilter } from '@/features/reading-list/validation';

function CollectionCard({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex min-h-11 items-center justify-between gap-3">
        <h2 className="text-base font-medium tracking-tight">{title}</h2>
        <Link
          href={href}
          className="flex min-h-11 items-center rounded-md px-2 text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          Open
        </Link>
      </div>
      {children}
    </section>
  );
}

function CollectionSkeleton({ label }: { label: string }) {
  return (
    <p
      aria-live="polite"
      className="min-h-11 py-3 text-sm text-muted-foreground"
    >
      Loading {label}…
    </p>
  );
}

export function HomeCollections() {
  const bookmarks = useBookmarks(parseFolderFilter(undefined), undefined);
  const reading = useReadingItems(parseTopicFilter(undefined));

  return (
    <>
      <CollectionCard title="Bookmarks" href="/bookmarks">
        {bookmarks.error ? (
          <LoadError message={bookmarks.error.message} />
        ) : !bookmarks.data ? (
          <CollectionSkeleton label="bookmarks" />
        ) : bookmarks.data.items.length === 0 ? (
          <p className="py-3 text-sm text-muted-foreground">
            No bookmarks saved yet.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {bookmarks.data.items.slice(0, 4).map((item) => (
              <li
                key={item.id}
                className="flex min-h-14 min-w-0 items-center gap-3 py-2"
              >
                <SiteIcon title={item.title} url={item.url} />
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-0 flex-1 truncate rounded text-sm font-medium outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        )}
      </CollectionCard>

      <CollectionCard title="Reading queue" href="/reading-list">
        {reading.error ? (
          <LoadError message={reading.error.message} />
        ) : !reading.data ? (
          <CollectionSkeleton label="reading queue" />
        ) : splitReading(reading.data.items).unread.length === 0 ? (
          <p className="py-3 text-sm text-muted-foreground">
            Nothing unread right now.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {splitReading(reading.data.items)
              .unread.slice(0, 4)
              .map((item) => (
                <li
                  key={item.id}
                  className="flex min-h-14 min-w-0 items-center gap-3 py-2"
                >
                  <SiteIcon title={item.title} url={item.url} />
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="min-w-0 flex-1 truncate rounded text-sm font-medium outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {item.title}
                  </a>
                </li>
              ))}
          </ul>
        )}
      </CollectionCard>
    </>
  );
}
