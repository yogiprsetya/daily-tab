import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/db';
import { createTodo } from '@/features/todos/dal';
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
    new Request(`http://localhost/api/todos/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    ctx(id)
  );
}

const remove = (id: string) =>
  DELETE(new Request(`http://localhost/api/todos/${id}`), ctx(id));

beforeEach(async () => {
  signOut();
  await db.execute(sql`truncate ${todos}, ${projects}`);
});

describe('PATCH /api/todos/[id]', () => {
  it('returns 401 without a session', async () => {
    const row = await createTodo({ title: 'A' });

    expect((await patch(row.id, { completed: true })).status).toBe(401);
  });

  it('completes a todo', async () => {
    await signIn();
    const row = await createTodo({ title: 'A' });

    const res = await patch(row.id, { completed: true });

    expect(res.status).toBe(200);
    expect((await res.json()).completedAt).toEqual(expect.any(String));
  });

  it('updates and clears the link and notes', async () => {
    await signIn();
    const row = await createTodo({ title: 'A' });

    const set = await patch(row.id, { url: 'example.com', notes: 'why' });
    expect(await set.json()).toMatchObject({
      url: 'https://example.com/',
      notes: 'why',
    });

    const cleared = await patch(row.id, { url: '', notes: '' });
    expect(await cleared.json()).toMatchObject({ url: null, notes: null });
  });

  it('returns 400 for an empty update', async () => {
    await signIn();
    const row = await createTodo({ title: 'A' });

    expect((await patch(row.id, {})).status).toBe(400);
  });

  it('returns 400 for a project that does not exist', async () => {
    await signIn();
    const row = await createTodo({ title: 'A' });

    expect((await patch(row.id, { projectId: UNKNOWN })).status).toBe(400);
  });

  it.each([UNKNOWN, 'not-a-uuid'])('returns 404 for id %s', async (id) => {
    await signIn();

    expect((await patch(id, { title: 'x' })).status).toBe(404);
  });
});

describe('DELETE /api/todos/[id]', () => {
  it('returns 401 without a session', async () => {
    const row = await createTodo({ title: 'A' });

    expect((await remove(row.id)).status).toBe(401);
  });

  it('deletes and returns 204', async () => {
    await signIn();
    const row = await createTodo({ title: 'A' });

    expect((await remove(row.id)).status).toBe(204);
    expect(await db.select().from(todos)).toHaveLength(0);
  });

  it.each([UNKNOWN, 'not-a-uuid'])('returns 404 for id %s', async (id) => {
    await signIn();

    expect((await remove(id)).status).toBe(404);
  });
});
