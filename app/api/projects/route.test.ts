import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/db';
import { createProject, createTodo } from '@/features/todos/dal';
import { projects, todos } from '@/features/todos/schema';
import { signIn, signOut } from '@/tests/session';
import { GET, POST } from './route';

vi.mock('next/headers', async () => ({
  cookies: (await import('@/tests/session')).mockedCookies,
}));

function post(body: unknown) {
  return POST(
    new Request('http://localhost/api/projects', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
  );
}

beforeEach(async () => {
  signOut();
  await db.execute(sql`truncate ${todos}, ${projects}`);
});

describe('GET /api/projects', () => {
  it('returns 401 without a session', async () => {
    expect((await GET()).status).toBe(401);
  });

  it('returns projects with pending counts', async () => {
    await signIn();
    const work = await createProject('Work');
    await createTodo({ title: 'A', projectId: work.id });

    const body = await (await GET()).json();

    expect(body.items).toMatchObject([{ name: 'Work', pendingCount: 1 }]);
  });
});

describe('POST /api/projects', () => {
  it('returns 401 without a session', async () => {
    expect((await post({ name: 'Work' })).status).toBe(401);
  });

  it('creates a project', async () => {
    await signIn();

    const res = await post({ name: ' Work ' });

    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ name: 'Work' });
  });

  it('returns 409 for a duplicate in another case', async () => {
    await signIn();
    await createProject('work');

    const res = await post({ name: 'Work' });

    expect(res.status).toBe(409);
    expect((await res.json()).error.code).toBe('conflict');
  });

  it('returns 400 for an empty name', async () => {
    await signIn();

    expect((await post({ name: ' ' })).status).toBe(400);
  });
});
