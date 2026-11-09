'use client';

import { Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type ReactNode, useOptimistic, useState, useTransition } from 'react';
import { ICON_BUTTON } from '@/components/form-styles';
import { SiteIcon } from '@/components/site-icon';
import { Checkbox } from '@/components/ui/checkbox';
import { apiRequest } from '@/lib/api-client';
import { displayHost } from '@/lib/url';
import { cn } from '@/lib/utils';
import {
  type ReadingLists,
  type ReadingRow as Row,
  applyToggle,
} from '../optimistic';
import { ReadingDialog } from './reading-dialog';

function ReadingRow({
  item,
  read,
  showTopic,
  onToggle,
  onEdit,
}: {
  item: Row;
  read: boolean;
  showTopic: boolean;
  onToggle: () => void;
  onEdit: () => void;
}) {
  const host = displayHost(item.url);
  const meta =
    showTopic && item.topicName ? `${host} · ${item.topicName}` : host;

  return (
    <li className="flex min-w-0 items-center gap-3 py-1.5">
      {/* Its own label: the title is a link and must not tick the box. */}
      <label className="flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg has-focus-visible:ring-2 has-focus-visible:ring-ring">
        <Checkbox
          checked={read}
          onCheckedChange={onToggle}
          aria-label={`Mark ${item.title} as ${read ? 'unread' : 'read'}`}
          className="size-5 rounded-md"
        />
      </label>
      <SiteIcon title={item.title} url={item.url} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className={cn(
            'truncate rounded text-sm font-medium underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring',
            read && 'text-muted-foreground'
          )}
        >
          {item.title}
        </a>
        <p className="truncate text-xs text-muted-foreground">{meta}</p>
        {item.notes && (
          <p className="line-clamp-2 text-xs wrap-anywhere whitespace-pre-line text-muted-foreground">
            {item.notes}
          </p>
        )}
      </div>
      <button
        type="button"
        aria-label={`Edit ${item.title}`}
        onClick={onEdit}
        className={ICON_BUTTON}
      >
        <Pencil aria-hidden className="size-4" />
      </button>
    </li>
  );
}

export function ReadingList({
  unread,
  read,
  topics,
  showTopic,
  filtered,
  addAction,
}: ReadingLists & {
  topics: { id: string; name: string }[];
  showTopic: boolean;
  filtered: boolean;
  addAction: ReactNode;
}) {
  const router = useRouter();
  const [lists, toggleOptimistic] = useOptimistic(
    { unread, read },
    applyToggle
  );
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Row | null>(null);
  const queueIsEmpty =
    !filtered && lists.unread.length === 0 && lists.read.length === 0;

  function toggle(item: Row, nextRead: boolean) {
    setError(null);
    startTransition(async () => {
      toggleOptimistic({ id: item.id, read: nextRead });
      const result = await apiRequest(`/api/reading-items/${item.id}`, {
        method: 'PATCH',
        body: { read: nextRead },
      });
      // Inside the transition, so the optimistic state holds until fresh data lands.
      if (result.ok) router.refresh();
      else setError(result.message);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {lists.unread.length === 0 ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-muted-foreground">
            {queueIsEmpty ? 'Nothing to read yet' : 'Nothing unread here'}
          </p>
          {queueIsEmpty && addAction}
        </div>
      ) : (
        <ul className="flex flex-col">
          {lists.unread.map((item) => (
            <ReadingRow
              key={item.id}
              item={item}
              read={false}
              showTopic={showTopic}
              onToggle={() => toggle(item, true)}
              onEdit={() => setEditing(item)}
            />
          ))}
        </ul>
      )}

      {lists.read.length > 0 && (
        <details className="group">
          <summary className="flex min-h-11 cursor-pointer items-center rounded-lg text-sm text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Read ({lists.read.length})
          </summary>
          <ul className="flex flex-col">
            {lists.read.map((item) => (
              <ReadingRow
                key={item.id}
                item={item}
                read
                showTopic={showTopic}
                onToggle={() => toggle(item, false)}
                onEdit={() => setEditing(item)}
              />
            ))}
          </ul>
        </details>
      )}

      {editing && (
        <ReadingDialog
          key={editing.id}
          item={editing}
          topics={topics}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
