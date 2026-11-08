import { requirePageSession } from '@/features/auth/require-session';
import {
  countPending,
  listCompleted,
  listPending,
  listProjects,
  pendingWithoutProject,
  resolveFilter,
} from '../dal';
import { toItem } from '../optimistic';
import { parseProjectFilter } from '../validation';
import { AddTodoForm } from './add-todo-form';
import { ProjectFilter } from './project-filter';
import { ProjectManager } from './project-manager';
import { TodoList } from './todo-list';

/** Reads the session, URL and database: render inside <Suspense>. */
export async function TodosView({
  searchParams,
}: {
  searchParams: Promise<{ project?: string | string[] }>;
}) {
  await requirePageSession();
  const { project } = await searchParams;
  const filter = await resolveFilter(parseProjectFilter(project));

  const [pending, completed, projects, total, withoutProject] =
    await Promise.all([
      listPending(filter),
      listCompleted(filter),
      listProjects(),
      countPending(),
      pendingWithoutProject(),
    ]);

  const projectOptions = projects.map(({ id, name }) => ({ id, name }));

  return (
    <>
      <div className="flex flex-col gap-1">
        <ProjectFilter
          filter={filter}
          projects={projects}
          total={total}
          withoutProject={withoutProject}
        />
        <ProjectManager projects={projectOptions} />
      </div>
      <AddTodoForm
        projects={projectOptions}
        defaultProjectId={filter.kind === 'project' ? filter.id : null}
      />
      <TodoList
        pending={pending.map(toItem)}
        completed={completed.map(toItem)}
        projects={projectOptions}
      />
    </>
  );
}
