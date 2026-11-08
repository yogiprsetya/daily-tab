import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/db';
import { getAuthConfig } from '@/features/auth/config';
import { loginAttempts } from '@/features/auth/schema';
import { SESSION_COOKIE, verifySession } from '@/features/auth/session';
import { POST } from './route';

// `connection()` needs a Next.js request scope; outside one it throws.
vi.mock('next/server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/server')>()),
  connection: vi.fn(async () => {}),
}));

const RIGHT = { email: 'owner@example.com', pin: '482913' }; // vitest.config.mts
const WRONG = { email: 'owner@example.com', pin: '000000' };

function login(body: unknown, ip = '203.0.113.5') {
  return POST(
    new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    })
  );
}

const attempts = () => db.select().from(loginAttempts);

function sessionToken(res: Response) {
  const header = res.headers.get('set-cookie') ?? '';
  return header.match(new RegExp(`${SESSION_COOKIE}=([^;]*)`))?.[1];
}

beforeEach(async () => {
  await db.execute(sql`truncate ${loginAttempts}`);
});

describe('POST /api/auth/login', () => {
  it('sets a valid session cookie and records success', async () => {
    const res = await login(RIGHT);

    expect(res.status).toBe(200);
    const cookie = res.headers.get('set-cookie')!;
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/Secure/i);
    expect(cookie).toMatch(/SameSite=lax/i);
    expect(cookie).toMatch(/Path=\//);
    expect(cookie).toMatch(/Max-Age=2592000/);
    expect(
      await verifySession(sessionToken(res), getAuthConfig().secret)
    ).not.toBeNull();
    expect(await attempts()).toMatchObject([
      { ip: '203.0.113.5', succeeded: true },
    ]);
  });

  it('accepts the email with different case', async () => {
    const res = await login({ ...RIGHT, email: 'OWNER@example.com' });

    expect(res.status).toBe(200);
  });

  it('returns a generic 401 for a wrong PIN and records the failure', async () => {
    const res = await login(WRONG);

    expect(res.status).toBe(401);
    expect(res.headers.get('set-cookie')).toBeNull();
    expect((await res.json()).error).toEqual({
      code: 'unauthorized',
      message: 'Email or PIN is incorrect',
    });
    expect(await attempts()).toMatchObject([{ succeeded: false }]);
  });

  it('gives the same answer for a wrong email', async () => {
    const res = await login({ ...RIGHT, email: 'someone@example.com' });

    expect((await res.json()).error.message).toBe('Email or PIN is incorrect');
  });

  it('refuses the 6th attempt from an IP, even with the right PIN, without recording it', async () => {
    for (let i = 0; i < 5; i++) await login(WRONG);

    const res = await login(RIGHT);

    expect(res.status).toBe(429);
    expect(Number(res.headers.get('retry-after'))).toBeGreaterThan(0);
    expect(res.headers.get('set-cookie')).toBeNull();
    expect((await res.json()).error.code).toBe('rate_limited');
    expect(await attempts()).toHaveLength(5);
  });

  it('rejects an invalid body without echoing the PIN', async () => {
    const res = await login({ email: 'owner@example.com', pin: 482913 });

    expect(res.status).toBe(400);
    expect(await res.text()).not.toContain('482913');
    expect(await attempts()).toHaveLength(0);
  });

  it('rejects malformed JSON', async () => {
    const res = await login('{"email":');

    expect(res.status).toBe(400);
  });
});
