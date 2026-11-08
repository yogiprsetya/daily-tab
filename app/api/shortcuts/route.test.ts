import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/db';
import { shortcuts } from '@/features/shortcuts/schema';
import { signIn, signOut } from '@/tests/session';
import { GET, POST } from './route';

vi.mock('next/headers', async () => ({
  cookies: (await import('@/tests/session')).mockedCookies,
}));

function post(body: unknown) {
  return POST(
    new Request('http://localhost/api/shortcuts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
  );
}

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

describe('POST /api/shortcuts', () => {
  it('returns 401 without a session and stores nothing', async () => {
    const res = await post({ title: 'GitHub', url: 'github.com' });

    expect(res.status).toBe(401);
    expect(await db.select().from(shortcuts)).toHaveLength(0);
  });

  it('creates a shortcut with a normalized URL', async () => {
    await signIn();

    const res = await post({ title: ' GitHub ', url: 'github.com' });

    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({
      title: 'GitHub',
      url: 'https://github.com/',
      position: 1,
    });
  });

  it('rejects a javascript: URL', async () => {
    await signIn();

    const res = await post({ title: 'Bad', url: 'javascript:alert(1)' });

    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe('validation_error');
    expect(await db.select().from(shortcuts)).toHaveLength(0);
  });
});
