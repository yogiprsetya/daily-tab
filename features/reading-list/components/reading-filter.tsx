import { FilterLink } from '@/components/grouping/filter-link';
import { FilterNav } from '@/components/grouping/filter-nav';
import type { TopicFilter } from '../validation';

export function ReadingFilter({
  filter,
  topics,
  total,
  withoutTopic,
}: {
  filter: TopicFilter;
  topics: { id: string; name: string; unreadCount: number }[];
  total: number;
  withoutTopic: number;
}) {
  return (
    <FilterNav
      label="Filter by topic"
      activeKey={filter.kind === 'topic' ? filter.id : filter.kind}
    >
      <FilterLink
        href="/reading-list"
        label="All"
        count={total}
        active={filter.kind === 'all'}
      />
      {topics.map((topic) => (
        <FilterLink
          key={topic.id}
          href={`/reading-list?topic=${topic.id}`}
          label={topic.name}
          count={topic.unreadCount}
          active={filter.kind === 'topic' && filter.id === topic.id}
        />
      ))}
      <FilterLink
        href="/reading-list?topic=none"
        label="No topic"
        count={withoutTopic}
        active={filter.kind === 'none'}
      />
    </FilterNav>
  );
}
