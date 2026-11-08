import { getAuthConfig } from '@/features/auth/config';
import { SESSION_COOKIE, signSession } from '@/features/auth/session';

/**
 * Test double for `next/headers`. In a test file:
 *
 *   vi.mock('next/headers', async () => ({
 *     cookies: (await import('@/tests/session')).mockedCookies,
 *   }));
 */
const jar = new Map<string, string>();

export async function mockedCookies() {
  return {
    get: (name: string) =>
      jar.has(name) ? { name, value: jar.get(name)! } : undefined,
  };
}

export async function signIn() {
  const { token } = await signSession(getAuthConfig().secret);
  jar.set(SESSION_COOKIE, token);
}

export function setSessionCookie(value: string) {
  jar.set(SESSION_COOKIE, value);
}

export function signOut() {
  jar.clear();
}
