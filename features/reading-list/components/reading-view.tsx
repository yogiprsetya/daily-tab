import { GroupManager } from '@/components/grouping/group-manager';
import { requirePageSession } from '@/features/auth/require-session';
import {
  countUnread,
  listRead,
  listTopics,
  listUnread,
  resolveTopicFilter,
  unreadWithoutTopic,
} from '../dal';
import { toItem } from '../optimistic';
import { parseTopicFilter } from '../validation';
import { AddReadingButton } from './add-reading-button';
import { ReadingFilter } from './reading-filter';
import { ReadingList } from './reading-list';

const TOPIC_COPY = {
  trigger: 'Manage topics',
  title: 'Topics',
  description: 'Deleting a topic keeps its links; they move to No topic.',
  placeholder: 'New topic',
  newNameLabel: 'New topic name',
};

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

  const topicOptions = topics.map(({ id, name }) => ({ id, name }));
  const addLink = (
    <AddReadingButton
      topics={topicOptions}
      defaultTopicId={filter.kind === 'topic' ? filter.id : null}
    />
  );

  return (
    <>
      <div className="flex flex-col items-start gap-1">
        <div className="flex w-full items-start justify-between gap-3">
          <ReadingFilter
            filter={filter}
            topics={topics}
            total={total}
            withoutTopic={withoutTopic}
          />
          {addLink}
        </div>

        <GroupManager
          endpoint="/api/reading-topics"
          groups={topicOptions}
          copy={TOPIC_COPY}
        />
      </div>

      <ReadingList
        unread={unread.map(toItem)}
        read={read.map(toItem)}
        topics={topicOptions}
        filtered={filter.kind !== 'all'}
        addAction={addLink}
      />
    </>
  );
}
