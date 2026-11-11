'use client';

import { useSearchParams } from 'next/navigation';
import { GroupManager } from '@/components/grouping/group-manager';
import { LoadError } from '@/components/load-error';
import { useReadingItems, useTopics } from '../hooks';
import { splitReading } from '../optimistic';
import { parseTopicFilter } from '../validation';
import { AddReadingButton } from './add-reading-button';
import { ReadingFilter } from './reading-filter';
import { ReadingList } from './reading-list';
import { ReadingSkeleton } from './reading-skeleton';

const TOPIC_COPY = {
  trigger: 'Manage topics',
  title: 'Topics',
  description: 'Deleting a topic keeps its links; they move to No topic.',
  placeholder: 'New topic',
  newNameLabel: 'New topic name',
};

/** Client-rendered: the page only gates the session, the data comes from SWR. */
export function ReadingView() {
  const params = useSearchParams();
  const requested = parseTopicFilter(params.get('topic') ?? undefined);
  const items = useReadingItems(requested);
  const topics = useTopics();

  if (items.error) return <LoadError message={items.error.message} />;
  if (topics.error) return <LoadError message={topics.error.message} />;
  if (!items.data || !topics.data) return <ReadingSkeleton />;

  // The server resolves an unknown topic to All; its answer wins.
  const filter = items.data.filter;
  const { unread, read } = splitReading(items.data.items);
  const topicOptions = topics.data.items.map(({ id, name }) => ({ id, name }));
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
            topics={topics.data.items}
            total={topics.data.total}
            withoutTopic={topics.data.withoutTopic}
          />
          {addLink}
        </div>

        <GroupManager
          feature="reading-topics"
          itemFeature="reading-items"
          endpoint="/api/reading-topics"
          groups={topicOptions}
          copy={TOPIC_COPY}
        />
      </div>

      <ReadingList
        unread={unread}
        read={read}
        topics={topicOptions}
        filtered={filter.kind !== 'all'}
        addAction={addLink}
      />
    </>
  );
}
