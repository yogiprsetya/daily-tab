import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/db';
import { shortcuts } from '@/features/shortcuts/schema';
import { signIn, signOut } from '@/tests/session';
import { GET } from './route';

vi.mock('next/headers', async () => ({
  cookies: (await import('@/tests/session')).mockedCookies,
}));

beforeEach(async () => {
  signOut();
  await db.execute(sql`truncate ${shortcuts}`);
});

describe('GET /api/shortcuts', () => {
  it('returns 401 without a session', async () => {
    const res = await GET();

    expect(res.status).toBe(401);
  });

  it('returns the shortcuts in order', async () => {
    await signIn();
    await db.insert(shortcuts).values([
      { title: 'Second', url: 'https://b.example/', position: 2 },
      { title: 'First', url: 'https://a.example/', position: 1 },
    ]);

    const res = await GET();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items.map((s: { title: string }) => s.title)).toEqual([
      'First',
      'Second',
    ]);
    expect(body.items[0]).toMatchObject({
      id: expect.any(String),
      url: 'https://a.example/',
      position: 1,
    });
  });
});
