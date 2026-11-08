import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAuthConfig } from './config';
import { requireSession } from './require-session';
import { SESSION_COOKIE, signSession } from './session';

const cookieJar = new Map<string, string>();

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) =>
      cookieJar.has(name) ? { name, value: cookieJar.get(name) } : undefined,
  }),
}));

beforeEach(() => {
  cookieJar.clear();
});

describe('requireSession', () => {
  it('returns the session when the cookie is valid', async () => {
    const { token } = await signSession(getAuthConfig().secret);
    cookieJar.set(SESSION_COOKIE, token);

    const result = await requireSession();

    expect(result.ok).toBe(true);
  });

  it('returns a 401 JSON response without a cookie', async () => {
    const result = await requireSession();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(401);
    expect((await result.response.json()).error.code).toBe('unauthorized');
  });

  it('returns 401 for an invalid cookie', async () => {
    cookieJar.set(SESSION_COOKIE, 'forged');

    const result = await requireSession();

    expect(result.ok).toBe(false);
  });
});
