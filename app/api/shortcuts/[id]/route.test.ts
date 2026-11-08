import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/db';
import { shortcuts } from '@/features/shortcuts/schema';
import { signIn, signOut } from '@/tests/session';
import { DELETE, PATCH } from './route';

vi.mock('next/headers', async () => ({
  cookies: (await import('@/tests/session')).mockedCookies,
}));

const UNKNOWN = '6f1d2c3a-9b4e-4f7a-8c21-0d5e6f7a8b9c';
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

function patch(id: string, body: unknown) {
  return PATCH(
    new Request(`http://localhost/api/shortcuts/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    ctx(id)
  );
}

const remove = (id: string) =>
  DELETE(new Request(`http://localhost/api/shortcuts/${id}`), ctx(id));

async function seed() {
  const [row] = await db
    .insert(shortcuts)
    .values({ title: 'Old', url: 'https://old.example/', position: 1 })
    .returning();
  return row;
}

beforeEach(async () => {
  signOut();
  await db.execute(sql`truncate ${shortcuts}`);
});

describe('PATCH /api/shortcuts/[id]', () => {
  it('returns 401 without a session', async () => {
    const row = await seed();

    expect((await patch(row.id, { title: 'New' })).status).toBe(401);
  });

  it('updates the title and normalizes a new URL', async () => {
    await signIn();
    const row = await seed();

    const res = await patch(row.id, { title: 'New', url: 'new.example' });

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      title: 'New',
      url: 'https://new.example/',
    });
  });

  it('returns 400 for an empty update', async () => {
    await signIn();
    const row = await seed();

    expect((await patch(row.id, {})).status).toBe(400);
  });

  it.each([UNKNOWN, 'not-a-uuid'])('returns 404 for id %s', async (id) => {
    await signIn();

    const res = await patch(id, { title: 'New' });

    expect(res.status).toBe(404);
    expect((await res.json()).error.code).toBe('not_found');
  });
});

describe('DELETE /api/shortcuts/[id]', () => {
  it('returns 401 without a session and keeps the row', async () => {
    const row = await seed();

    expect((await remove(row.id)).status).toBe(401);
    expect(await db.select().from(shortcuts)).toHaveLength(1);
  });

  it('deletes and returns 204 with no body', async () => {
    await signIn();
    const row = await seed();

    const res = await remove(row.id);

    expect(res.status).toBe(204);
    expect(await res.text()).toBe('');
    expect(await db.select().from(shortcuts)).toHaveLength(0);
  });

  it.each([UNKNOWN, 'not-a-uuid'])('returns 404 for id %s', async (id) => {
    await signIn();

    expect((await remove(id)).status).toBe(404);
  });
});
