import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/db';
import { shortcuts } from '@/features/shortcuts/schema';
import { signIn, signOut } from '@/tests/session';
import { POST } from './route';

vi.mock('next/headers', async () => ({
  cookies: (await import('@/tests/session')).mockedCookies,
}));

const UNKNOWN = '6f1d2c3a-9b4e-4f7a-8c21-0d5e6f7a8b9c';

function move(id: string, direction: unknown) {
  return POST(
    new Request(`http://localhost/api/shortcuts/${id}/move`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ direction }),
    }),
    { params: Promise.resolve({ id }) }
  );
}

async function seed() {
  return db
    .insert(shortcuts)
    .values([
      { title: 'A', url: 'https://a.example/', position: 1 },
      { title: 'B', url: 'https://b.example/', position: 2 },
    ])
    .returning();
}

const titlesOf = async (res: Response) =>
  (await res.json()).items.map((s: { title: string }) => s.title);

beforeEach(async () => {
  signOut();
  await db.execute(sql`truncate ${shortcuts}`);
});

describe('POST /api/shortcuts/[id]/move', () => {
  it('returns 401 without a session', async () => {
    const [a] = await seed();

    expect((await move(a.id, 'down')).status).toBe(401);
  });

  it('returns the new order', async () => {
    await signIn();
    const [a] = await seed();

    const res = await move(a.id, 'down');

    expect(res.status).toBe(200);
    expect(await titlesOf(res)).toEqual(['B', 'A']);
  });

  it('returns 200 and the same order at the edge', async () => {
    await signIn();
    const [a] = await seed();

    const res = await move(a.id, 'up');

    expect(res.status).toBe(200);
    expect(await titlesOf(res)).toEqual(['A', 'B']);
  });

  it('returns 400 for an invalid direction', async () => {
    await signIn();
    const [a] = await seed();

    expect((await move(a.id, 'left')).status).toBe(400);
  });

  it.each([UNKNOWN, 'not-a-uuid'])('returns 404 for id %s', async (id) => {
    await signIn();

    expect((await move(id, 'up')).status).toBe(404);
  });
});
