import { FilterLink } from '@/components/grouping/filter-link';
import { FilterNav } from '@/components/grouping/filter-nav';
import type { ProjectFilter as Filter } from '../validation';

export function ProjectFilter({
  filter,
  projects,
  total,
  withoutProject,
}: {
  filter: Filter;
  projects: { id: string; name: string; pendingCount: number }[];
  total: number;
  withoutProject: number;
}) {
  return (
    <FilterNav
      label="Filter by project"
      activeKey={filter.kind === 'project' ? filter.id : filter.kind}
    >
      <FilterLink
        href="/todos"
        label="All"
        count={total}
        active={filter.kind === 'all'}
      />
      {projects.map((project) => (
        <FilterLink
          key={project.id}
          href={`/todos?project=${project.id}`}
          label={project.name}
          count={project.pendingCount}
          active={filter.kind === 'project' && filter.id === project.id}
        />
      ))}
      <FilterLink
        href="/todos?project=none"
        label="No project"
        count={withoutProject}
        active={filter.kind === 'none'}
      />
    </FilterNav>
  );
}
