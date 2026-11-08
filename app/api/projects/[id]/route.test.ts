import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/db';
import { createProject, createTodo } from '@/features/todos/dal';
import { projects, todos } from '@/features/todos/schema';
import { signIn, signOut } from '@/tests/session';
import { DELETE, PATCH } from './route';

vi.mock('next/headers', async () => ({
  cookies: (await import('@/tests/session')).mockedCookies,
}));

const UNKNOWN = '6f1d2c3a-9b4e-4f7a-8c21-0d5e6f7a8b9c';
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

function patch(id: string, body: unknown) {
  return PATCH(
    new Request(`http://localhost/api/projects/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    ctx(id)
  );
}

const remove = (id: string) =>
  DELETE(new Request(`http://localhost/api/projects/${id}`), ctx(id));

beforeEach(async () => {
  signOut();
  await db.execute(sql`truncate ${todos}, ${projects}`);
});

describe('PATCH /api/projects/[id]', () => {
  it('returns 401 without a session', async () => {
    const row = await createProject('Work');

    expect((await patch(row.id, { name: 'New' })).status).toBe(401);
  });

  it('renames', async () => {
    await signIn();
    const row = await createProject('Work');

    const res = await patch(row.id, { name: 'Job' });

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ name: 'Job' });
  });

  it('returns 409 when the name is taken', async () => {
    await signIn();
    await createProject('Work');
    const home = await createProject('Home');

    expect((await patch(home.id, { name: 'work' })).status).toBe(409);
  });

  it.each([UNKNOWN, 'not-a-uuid'])('returns 404 for id %s', async (id) => {
    await signIn();

    expect((await patch(id, { name: 'x' })).status).toBe(404);
  });
});

describe('DELETE /api/projects/[id]', () => {
  it('returns 401 without a session', async () => {
    const row = await createProject('Work');

    expect((await remove(row.id)).status).toBe(401);
  });

  it('deletes the project and keeps its todos', async () => {
    await signIn();
    const work = await createProject('Work');
    await createTodo({ title: 'survives', projectId: work.id });

    expect((await remove(work.id)).status).toBe(204);

    expect(await db.select().from(todos)).toMatchObject([
      { title: 'survives', projectId: null },
    ]);
  });

  it.each([UNKNOWN, 'not-a-uuid'])('returns 404 for id %s', async (id) => {
    await signIn();

    expect((await remove(id)).status).toBe(404);
  });
});
