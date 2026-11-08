import { type NextRequest, NextResponse } from 'next/server';
import { getAuthConfig } from '@/features/auth/config';
import { isSameOrigin } from '@/features/auth/request';
import {
  SESSION_COOKIE,
  needsRefresh,
  sessionCookie,
  signSession,
  verifySession,
} from '@/features/auth/session';
import { apiError } from '@/lib/api';

/**
 * Optimistic auth gate (no DB access): verifies the session JWT on every
 * non-asset request. Route Handlers re-check with requireSession().
 */

const PUBLIC_API = new Set(['/api/auth/login', '/api/health']);
const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export async function proxy(request: NextRequest) {
  const { pathname, search, origin } = request.nextUrl;
  const isApi = pathname === '/api' || pathname.startsWith('/api/');

  // CSRF: browsers always send Origin on cross-site and same-origin mutations.
  if (isApi && MUTATING.has(request.method)) {
    if (!isSameOrigin(request.headers, origin)) {
      return apiError('forbidden', 'Cross-origin request rejected');
    }
  }

  if (isApi && PUBLIC_API.has(pathname)) return NextResponse.next();

  const { secret } = getAuthConfig();
  const session = await verifySession(
    request.cookies.get(SESSION_COOKIE)?.value,
    secret
  );

  if (pathname === '/login') {
    return session
      ? NextResponse.redirect(new URL('/', request.url))
      : NextResponse.next();
  }

  if (!session) {
    if (isApi) return apiError('unauthorized', 'Sign in required');
    const login = new URL('/login', request.url);
    login.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  const res = NextResponse.next();
  if (needsRefresh(session)) {
    // Sliding expiry: new token and cookie, both valid for another 30 days.
    const { token } = await signSession(secret);
    res.cookies.set(sessionCookie(token));
  }
  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|icons/|manifest\\.webmanifest|favicon\\.ico|robots\\.txt).*)',
  ],
};
