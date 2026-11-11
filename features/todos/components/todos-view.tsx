'use client';

import { useSearchParams } from 'next/navigation';
import { GroupManager } from '@/components/grouping/group-manager';
import { LoadError } from '@/components/load-error';
import { useProjects, useTodos } from '../hooks';
import { splitTodos, toItem } from '../optimistic';
import { parseProjectFilter } from '../validation';
import { AddTodoButton } from './add-todo-button';
import { ProjectFilter } from './project-filter';
import { TodoList } from './todo-list';
import { TodosSkeleton } from './todos-skeleton';

const PROJECT_COPY = {
  trigger: 'Manage projects',
  title: 'Projects',
  description: 'Deleting a project keeps its todos; they move to No project.',
  placeholder: 'New project',
  newNameLabel: 'New project name',
};

/** Client-rendered: the page only gates the session, the data comes from SWR. */
export function TodosView() {
  const params = useSearchParams();
  const requested = parseProjectFilter(params.get('project') ?? undefined);
  const todos = useTodos(requested);
  const projects = useProjects();

  if (todos.error) return <LoadError message={todos.error.message} />;
  if (projects.error) return <LoadError message={projects.error.message} />;
  if (!todos.data || !projects.data) return <TodosSkeleton />;

  // The server resolves an unknown project to All; its answer wins.
  const filter = todos.data.filter;
  const { pending, completed } = splitTodos(todos.data.items);
  const projectOptions = projects.data.items.map(({ id, name }) => ({
    id,
    name,
  }));

  return (
    <>
      <div className="flex flex-col items-start gap-1">
        <div className="flex w-full items-start justify-between gap-3">
          <ProjectFilter
            filter={filter}
            projects={projects.data.items}
            total={projects.data.total}
            withoutProject={projects.data.withoutProject}
          />

          <AddTodoButton
            projects={projectOptions}
            defaultProjectId={filter.kind === 'project' ? filter.id : null}
          />
        </div>

        <GroupManager
          feature="projects"
          itemFeature="todos"
          endpoint="/api/projects"
          groups={projectOptions}
          copy={PROJECT_COPY}
        />
      </div>

      <TodoList
        pending={pending.map(toItem)}
        completed={completed.map(toItem)}
        projects={projectOptions}
      />
    </>
  );
}
