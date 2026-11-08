import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { ProjectFilter as Filter } from '../validation';

const CHIP =
  'flex min-h-11 items-center gap-1.5 rounded-lg border border-border px-3 text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring';

function Chip({
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
    <li className="min-w-0">
      <Link
        href={href}
        aria-current={active ? 'page' : undefined}
        className={cn(
          CHIP,
          active && 'border-transparent bg-muted text-foreground'
        )}
      >
        <span className="truncate">{label}</span>
        <span className="text-xs tabular-nums">{count}</span>
      </Link>
    </li>
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
    <nav aria-label="Filter by project">
      <ul className="flex flex-wrap gap-2">
        <Chip
          href="/todos"
          label="All"
          count={total}
          active={filter.kind === 'all'}
        />
        {projects.map((project) => (
          <Chip
            key={project.id}
            href={`/todos?project=${project.id}`}
            label={project.name}
            count={project.pendingCount}
            active={filter.kind === 'project' && filter.id === project.id}
          />
        ))}
        <Chip
          href="/todos?project=none"
          label="No project"
          count={withoutProject}
          active={filter.kind === 'none'}
        />
      </ul>
    </nav>
  );
}
