import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setSessionCookie, signIn, signOut } from '@/tests/session';
import { requirePageSession, requireSession } from './require-session';

vi.mock('next/headers', async () => ({
  cookies: (await import('@/tests/session')).mockedCookies,
}));

const redirect = vi.hoisted(() =>
  vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  })
);
vi.mock('next/navigation', () => ({ redirect }));

const connection = vi.hoisted(() => vi.fn(async () => {}));
vi.mock('next/server', () => ({ connection }));

beforeEach(() => {
  signOut();
  redirect.mockClear();
  connection.mockClear();
});

describe('requireSession', () => {
  it('returns the session when the cookie is valid', async () => {
    await signIn();

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
    setSessionCookie('forged');

    const result = await requireSession();

    expect(result.ok).toBe(false);
  });
});

describe('requirePageSession', () => {
  it('waits for the request before checking the session', async () => {
    connection.mockRejectedValueOnce(new Error('prerender halted'));

    await expect(requirePageSession()).rejects.toThrow('prerender halted');
    expect(redirect).not.toHaveBeenCalled();
  });

  it('returns the session when the cookie is valid', async () => {
    await signIn();

    await expect(requirePageSession()).resolves.toMatchObject({ sub: 'owner' });
    expect(redirect).not.toHaveBeenCalled();
  });

  it('redirects to /login without a cookie', async () => {
    await expect(requirePageSession()).rejects.toThrow('NEXT_REDIRECT:/login');
  });

  it('redirects to /login for an invalid cookie', async () => {
    setSessionCookie('forged');

    await expect(requirePageSession()).rejects.toThrow('NEXT_REDIRECT:/login');
  });
});
