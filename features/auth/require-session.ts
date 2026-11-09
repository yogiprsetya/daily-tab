import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { apiError } from '@/lib/api';
import { getAuthConfig } from './config';
import { SESSION_COOKIE, type Session, verifySession } from './session';

/**
 * Defense in depth for Route Handlers: the proxy already gates requests, but
 * every non-public handler verifies the session again.
 */
export async function requireSession(): Promise<
  { ok: true; session: Session } | { ok: false; response: Response }
> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await verifySession(token, getAuthConfig().secret);

  if (!session) {
    return {
      ok: false,
      response: apiError('unauthorized', 'Sign in required'),
    };
  }
  return { ok: true, session };
}

/**
 * The same check for Server Components that read data. Must run inside a
 * <Suspense> boundary: it reads cookies, which is request-time data.
 */
export async function requirePageSession(): Promise<Session> {
  // Verifying the token reads the clock, which can't happen while prerendering.
  await connection();
  const result = await requireSession();
  if (!result.ok) redirect('/login');
  return result.session;
}
