import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/db';
import {
  DuplicateProjectError,
  UnknownProjectError,
  countPending,
  createProject,
  createTodo,
  listCompleted,
  listPending,
  listProjects,
  listTodos,
  pendingWithoutProject,
  removeProject,
  removeTodo,
  resolveFilter,
  updateProject,
  updateTodo,
} from './dal';
import { projects, todos } from './schema';

const UNKNOWN = '6f1d2c3a-9b4e-4f7a-8c21-0d5e6f7a8b9c';
const at = (minute: number) => new Date(Date.UTC(2026, 10, 8, 9, minute));

beforeEach(async () => {
  await db.execute(sql`truncate ${todos}, ${projects}`);
});

function seedTodo(
  title: string,
  minute: number,
  extra: { projectId?: string; completedAt?: Date } = {}
) {
  return db
    .insert(todos)
    .values({ title, createdAt: at(minute), ...extra })
    .returning()
    .then(([row]) => row);
}

const titles = (rows: { title: string }[]) => rows.map((r) => r.title);

describe('listing', () => {
  it('lists pending oldest first with the project name', async () => {
    const work = await createProject('Work');
    await seedTodo('newer', 2);
    await seedTodo('older', 1, { projectId: work.id });
    await seedTodo('done', 0, { completedAt: at(5) });

    const pending = await listPending({ kind: 'all' });

    expect(titles(pending)).toEqual(['older', 'newer']);
    expect(pending[0].projectName).toBe('Work');
    expect(pending[1].projectName).toBeNull();
  });

  it('lists completed most recently completed first', async () => {
    await seedTodo('first', 0, { completedAt: at(1) });
    await seedTodo('second', 1, { completedAt: at(9) });

    expect(titles(await listCompleted({ kind: 'all' }))).toEqual([
      'second',
      'first',
    ]);
  });

  it('filters by project and by none', async () => {
    const work = await createProject('Work');
    await seedTodo('in project', 0, { projectId: work.id });
    await seedTodo('loose', 1);

    expect(titles(await listPending({ kind: 'project', id: work.id }))).toEqual(
      ['in project']
    );
    expect(titles(await listPending({ kind: 'none' }))).toEqual(['loose']);
  });

  it('respects the limit', async () => {
    for (let i = 0; i < 7; i++) await seedTodo(`t${i}`, i);

    expect(titles(await listPending({ kind: 'all' }, 5))).toEqual([
      't0',
      't1',
      't2',
      't3',
      't4',
    ]);
  });

  it('listTodos returns pending then completed', async () => {
    await seedTodo('done', 0, { completedAt: at(5) });
    await seedTodo('open', 1);

    expect(titles(await listTodos({ kind: 'all' }))).toEqual(['open', 'done']);
  });

  it('counts pending in total and without a project', async () => {
    const work = await createProject('Work');
    await seedTodo('a', 0, { projectId: work.id });
    await seedTodo('b', 1);
    await seedTodo('c', 2, { completedAt: at(3) });

    expect(await countPending()).toBe(2);
    expect(await pendingWithoutProject()).toBe(1);
  });
});

describe('resolveFilter', () => {
  it('keeps a project that exists', async () => {
    const work = await createProject('Work');
    const filter = { kind: 'project', id: work.id } as const;

    expect(await resolveFilter(filter)).toEqual(filter);
  });

  it('turns an unknown project into all', async () => {
    expect(await resolveFilter({ kind: 'project', id: UNKNOWN })).toEqual({
      kind: 'all',
    });
  });

  it('leaves all and none alone', async () => {
    expect(await resolveFilter({ kind: 'none' })).toEqual({ kind: 'none' });
  });
});

describe('createTodo / updateTodo / removeTodo', () => {
  it('creates a pending todo', async () => {
    const row = await createTodo({ title: 'A' });

    expect(row).toMatchObject({
      title: 'A',
      projectId: null,
      completedAt: null,
    });
  });

  it('rejects a project that does not exist', async () => {
    await expect(
      createTodo({ title: 'A', projectId: UNKNOWN })
    ).rejects.toBeInstanceOf(UnknownProjectError);
    await expect(
      updateTodo((await createTodo({ title: 'B' })).id, { projectId: UNKNOWN })
    ).rejects.toBeInstanceOf(UnknownProjectError);
  });

  it('completes and reopens', async () => {
    const row = await createTodo({ title: 'A' });

    const done = await updateTodo(row.id, { completed: true });
    expect(done!.completedAt).toBeInstanceOf(Date);

    const reopened = await updateTodo(row.id, { completed: false });
    expect(reopened!.completedAt).toBeNull();
  });

  it('keeps the original completion time when completed twice', async () => {
    const row = await seedTodo('A', 0, { completedAt: at(1) });

    const again = await updateTodo(row.id, { completed: true });

    expect(again!.completedAt).toEqual(at(1));
  });

  it('moves a todo out of its project with null', async () => {
    const work = await createProject('Work');
    const row = await seedTodo('A', 0, { projectId: work.id });

    expect(await updateTodo(row.id, { projectId: null })).toMatchObject({
      projectId: null,
    });
  });

  it('returns null or false for an unknown id', async () => {
    expect(await updateTodo(UNKNOWN, { title: 'x' })).toBeNull();
    expect(await removeTodo(UNKNOWN)).toBe(false);
  });

  it('removes a todo', async () => {
    const row = await createTodo({ title: 'A' });

    expect(await removeTodo(row.id)).toBe(true);
    expect(await db.select().from(todos)).toHaveLength(0);
  });
});

describe('projects', () => {
  it('lists by name ignoring case, with pending counts', async () => {
    const b = await createProject('beta');
    await createProject('Alpha');
    await seedTodo('open', 0, { projectId: b.id });
    await seedTodo('done', 1, { projectId: b.id, completedAt: at(2) });

    expect((await listProjects()).map((p) => [p.name, p.pendingCount])).toEqual(
      [
        ['Alpha', 0],
        ['beta', 1],
      ]
    );
  });

  it('rejects a duplicate name in any case', async () => {
    await createProject('work');

    await expect(createProject('Work')).rejects.toBeInstanceOf(
      DuplicateProjectError
    );
  });

  it('rejects renaming onto another project', async () => {
    await createProject('work');
    const home = await createProject('home');

    await expect(updateProject(home.id, 'WORK')).rejects.toBeInstanceOf(
      DuplicateProjectError
    );
  });

  it('allows changing only the case of its own name', async () => {
    const work = await createProject('work');

    expect(await updateProject(work.id, 'Work')).toMatchObject({
      name: 'Work',
    });
  });

  it('returns null or false for an unknown id', async () => {
    expect(await updateProject(UNKNOWN, 'x')).toBeNull();
    expect(await removeProject(UNKNOWN)).toBe(false);
  });

  it('keeps todos when their project is deleted', async () => {
    const work = await createProject('Work');
    const todo = await seedTodo('survives', 0, { projectId: work.id });

    expect(await removeProject(work.id)).toBe(true);

    const [row] = await db.select().from(todos);
    expect(row).toMatchObject({ id: todo.id, projectId: null });
  });
});
