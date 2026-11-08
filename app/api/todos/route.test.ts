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

const UNKNOWN = '6f1d2c3a-9b4e-4f7a-8c21-0d5e6f7a8b9c';

const get = (query = '') =>
  GET(new Request(`http://localhost/api/todos${query}`));

function post(body: unknown) {
  return POST(
    new Request('http://localhost/api/todos', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
  );
}

const titlesOf = async (res: Response) =>
  (await res.json()).items.map((t: { title: string }) => t.title);

beforeEach(async () => {
  signOut();
  await db.execute(sql`truncate ${todos}, ${projects}`);
});

describe('GET /api/todos', () => {
  it('returns 401 without a session', async () => {
    expect((await get()).status).toBe(401);
  });

  it('applies the project filter', async () => {
    await signIn();
    const work = await createProject('Work');
    await createTodo({ title: 'in', projectId: work.id });
    await createTodo({ title: 'loose' });

    expect(await titlesOf(await get(`?project=${work.id}`))).toEqual(['in']);
    expect(await titlesOf(await get('?project=none'))).toEqual(['loose']);
  });

  it.each(['?project=garbage', `?project=${UNKNOWN}`])(
    'treats %s as all',
    async (query) => {
      await signIn();
      await createTodo({ title: 'a' });

      expect(await titlesOf(await get(query))).toEqual(['a']);
    }
  );
});

describe('POST /api/todos', () => {
  it('returns 401 without a session', async () => {
    expect((await post({ title: 'A' })).status).toBe(401);
  });

  it('creates a todo', async () => {
    await signIn();

    const res = await post({ title: '  A ' });

    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ title: 'A', completedAt: null });
  });

  it('normalizes the link', async () => {
    await signIn();

    const res = await post({ title: 'A', url: 'example.com' });

    expect(res.status).toBe(201);
    expect((await res.json()).url).toBe('https://example.com/');
  });

  it('rejects a javascript: link', async () => {
    await signIn();

    const res = await post({ title: 'A', url: 'javascript:alert(1)' });

    expect(res.status).toBe(400);
    expect(await db.select().from(todos)).toHaveLength(0);
  });

  it('returns 400 for an empty title', async () => {
    await signIn();

    expect((await post({ title: ' ' })).status).toBe(400);
  });

  it('returns 400 for a project that does not exist', async () => {
    await signIn();

    const res = await post({ title: 'A', projectId: UNKNOWN });

    expect(res.status).toBe(400);
    expect((await res.json()).error.issues[0].path).toEqual(['projectId']);
  });
});
