import 'server-only';
import { cookies } from 'next/headers';
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
