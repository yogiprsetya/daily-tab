import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { cn } from '@/lib/utils';
import type { ProjectFilter as Filter } from '../validation';
import { ProjectFilterNav } from './project-filter-nav';

function FilterLink({
  href,
  label,
  count,
  active,
}: {
  href: string;
  label: string;
  count: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      data-slot="button"
      className={cn(
        buttonVariants({
          variant: active ? 'secondary' : 'outline',
        }),
        'h-11',
        !active && 'text-muted-foreground'
      )}
    >
      <span className="max-w-40 truncate">{label}</span>
      <span className="text-xs tabular-nums">{count}</span>
    </Link>
  );
}

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
    <ProjectFilterNav
      activeKey={filter.kind === 'project' ? filter.id : filter.kind}
    >
      <ButtonGroup className="[&>[data-slot]:first-child]:rounded-l-lg [&>[data-slot]:last-child]:rounded-r-lg">
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
      </ButtonGroup>
    </ProjectFilterNav>
  );
}
