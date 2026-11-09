import { requirePageSession } from '@/features/auth/require-session';
import {
  countUnread,
  listRead,
  listTopics,
  listUnread,
  resolveTopicFilter,
  unreadWithoutTopic,
} from '../dal';
import { toRow } from '../optimistic';
import { parseTopicFilter } from '../validation';
import { ReadingFilter } from './reading-filter';
import { ReadingList } from './reading-list';

/** Reads the session, URL and database: render inside <Suspense>. */
export async function ReadingView({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string | string[] }>;
}) {
  await requirePageSession();
  const { topic } = await searchParams;
  const filter = await resolveTopicFilter(parseTopicFilter(topic));

  const [unread, read, topics, total, withoutTopic] = await Promise.all([
    listUnread(filter),
    listRead(filter),
    listTopics(),
    countUnread(),
    unreadWithoutTopic(),
  ]);

  return (
    <>
      <div className="flex w-full items-start justify-between gap-3">
        <ReadingFilter
          filter={filter}
          topics={topics}
          total={total}
          withoutTopic={withoutTopic}
        />
      </div>

      <ReadingList
        unread={unread.map(toRow)}
        read={read.map(toRow)}
        showTopic={filter.kind === 'all'}
        filtered={filter.kind !== 'all'}
      />
    </>
  );
}
