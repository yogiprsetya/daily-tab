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
import { AddTodoButton } from './add-todo-button';
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
      <div className="flex flex-col items-start gap-1">
        <div className="flex w-full items-start justify-between gap-3">
          <ProjectFilter
            filter={filter}
            projects={projects}
            total={total}
            withoutProject={withoutProject}
          />

          <AddTodoButton
            projects={projectOptions}
            defaultProjectId={filter.kind === 'project' ? filter.id : null}
          />
        </div>

        <ProjectManager projects={projectOptions} />
      </div>

      <TodoList
        pending={pending.map(toItem)}
        completed={completed.map(toItem)}
        projects={projectOptions}
      />
    </>
  );
}
