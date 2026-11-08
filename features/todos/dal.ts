import 'server-only';
import {
  type SQL,
  and,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  isNotNull,
  isNull,
  sql,
} from 'drizzle-orm';
import { db } from '@/db';
import {
  FOREIGN_KEY_VIOLATION,
  UNIQUE_VIOLATION,
  translatePgError,
} from '@/db/pg-errors';
import { projects, todos } from './schema';
import type { ProjectFilter } from './validation';

export class UnknownProjectError extends Error {}
export class DuplicateProjectError extends Error {}

function matchesFilter(filter: ProjectFilter): SQL | undefined {
  if (filter.kind === 'none') return isNull(todos.projectId);
  if (filter.kind === 'project') return eq(todos.projectId, filter.id);
  return undefined;
}

function selectTodos() {
  return db
    .select({ ...getTableColumns(todos), projectName: projects.name })
    .from(todos)
    .leftJoin(projects, eq(todos.projectId, projects.id))
    .$dynamic();
}

export function listPending(filter: ProjectFilter, limit?: number) {
  const query = selectTodos()
    .where(and(isNull(todos.completedAt), matchesFilter(filter)))
    .orderBy(asc(todos.createdAt));
  return limit === undefined ? query : query.limit(limit);
}

export function listCompleted(filter: ProjectFilter) {
  return selectTodos()
    .where(and(isNotNull(todos.completedAt), matchesFilter(filter)))
    .orderBy(desc(todos.completedAt));
}

export async function listTodos(filter: ProjectFilter) {
  const [pending, completed] = await Promise.all([
    listPending(filter),
    listCompleted(filter),
  ]);
  return [...pending, ...completed];
}

export async function countPending(): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(todos)
    .where(isNull(todos.completedAt));
  return row.total;
}

export async function pendingWithoutProject(): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(todos)
    .where(and(isNull(todos.completedAt), isNull(todos.projectId)));
  return row.total;
}

/** A filter on a project that no longer exists behaves as All. */
export async function resolveFilter(
  filter: ProjectFilter
): Promise<ProjectFilter> {
  if (filter.kind !== 'project') return filter;
  const [row] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.id, filter.id));
  return row ? filter : { kind: 'all' };
}

type TodoFields = {
  title?: string;
  projectId?: string | null;
  url?: string | null;
  notes?: string | null;
};

export function createTodo(input: TodoFields & { title: string }) {
  return translatePgError(
    { [FOREIGN_KEY_VIOLATION]: UnknownProjectError },
    async () => {
      const [row] = await db.insert(todos).values(input).returning();
      return row;
    }
  );
}

export function updateTodo(
  id: string,
  { completed, ...fields }: TodoFields & { completed?: boolean }
) {
  return translatePgError(
    { [FOREIGN_KEY_VIOLATION]: UnknownProjectError },
    async () => {
      const [row] = await db
        .update(todos)
        .set({
          ...fields,
          updatedAt: new Date(),
          ...(completed !== undefined && {
            completedAt: completed
              ? sql`coalesce(${todos.completedAt}, now())`
              : null,
          }),
        })
        .where(eq(todos.id, id))
        .returning();
      return row ?? null;
    }
  );
}

export async function removeTodo(id: string): Promise<boolean> {
  const rows = await db
    .delete(todos)
    .where(eq(todos.id, id))
    .returning({ id: todos.id });
  return rows.length > 0;
}

export function listProjects() {
  return db
    .select({
      ...getTableColumns(projects),
      pendingCount:
        sql<number>`count(${todos.id}) filter (where ${todos.completedAt} is null)`.mapWith(
          Number
        ),
    })
    .from(projects)
    .leftJoin(todos, eq(todos.projectId, projects.id))
    .groupBy(projects.id)
    .orderBy(sql`lower(${projects.name})`);
}

export function createProject(name: string) {
  return translatePgError(
    { [UNIQUE_VIOLATION]: DuplicateProjectError },
    async () => {
      const [row] = await db.insert(projects).values({ name }).returning();
      return row;
    }
  );
}

export function updateProject(id: string, name: string) {
  return translatePgError(
    { [UNIQUE_VIOLATION]: DuplicateProjectError },
    async () => {
      const [row] = await db
        .update(projects)
        .set({ name })
        .where(eq(projects.id, id))
        .returning();
      return row ?? null;
    }
  );
}

/** Its todos stay and fall back to No project (`ON DELETE SET NULL`). */
export async function removeProject(id: string): Promise<boolean> {
  const rows = await db
    .delete(projects)
    .where(eq(projects.id, id))
    .returning({ id: projects.id });
  return rows.length > 0;
}
