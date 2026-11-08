import {
  getRedirectUrl,
  unstable_doesMiddlewareMatch,
} from 'next/experimental/testing/server';
import { NextRequest, type NextResponse } from 'next/server';
import { describe, expect, it } from 'vitest';
import { getAuthConfig } from '@/features/auth/config';
import {
  SESSION_COOKIE,
  signSession,
  verifySession,
} from '@/features/auth/session';
import { config, proxy } from './proxy';

const ORIGIN = 'http://localhost:3000';
const DAY = 24 * 60 * 60 * 1000;

async function token(ageMs = 0) {
  const issuedAt = new Date(Date.now() - ageMs);
  return (await signSession(getAuthConfig().secret, issuedAt)).token;
}

function request(
  path: string,
  {
    method = 'GET',
    session,
    origin,
  }: { method?: string; session?: string; origin?: string } = {}
) {
  const headers = new Headers();
  if (session) headers.set('cookie', `${SESSION_COOKIE}=${session}`);
  if (origin) headers.set('origin', origin);
  return new NextRequest(`${ORIGIN}${path}`, { method, headers });
}

// proxy() returns Response | NextResponse; the testing helpers need NextResponse.
const run = async (req: NextRequest) => (await proxy(req)) as NextResponse;

const passesThrough = (res: Response) =>
  res.headers.get('x-middleware-next') === '1';

describe('matcher', () => {
  it.each([
    '/_next/static/chunks/app.js',
    '/_next/image?url=%2Ficons%2Ficon.svg&w=64&q=75',
    '/icons/icon-192.png',
    '/manifest.webmanifest',
    '/favicon.ico',
    '/robots.txt',
  ])('skips the static asset %s', (url) => {
    expect(unstable_doesMiddlewareMatch({ config, url })).toBe(false);
  });

  it.each(['/', '/todos', '/login', '/api/health', '/api/auth/login'])(
    'runs on %s',
    (url) => {
      expect(unstable_doesMiddlewareMatch({ config, url })).toBe(true);
    }
  );
});

describe('without a session', () => {
  it('redirects pages to /login and keeps the full path in next', async () => {
    const res = await run(request('/todos?project=home'));

    expect(res.status).toBe(307);
    expect(getRedirectUrl(res)).toBe(
      `${ORIGIN}/login?next=%2Ftodos%3Fproject%3Dhome`
    );
  });

  it('returns 401 JSON for API routes instead of redirecting', async () => {
    const res = await run(request('/api/todos'));

    expect(res.status).toBe(401);
    expect((await res.json()).error.code).toBe('unauthorized');
  });

  it.each(['/login', '/api/health'])(
    'lets public route %s through',
    async (path) => {
      expect(passesThrough(await run(request(path)))).toBe(true);
    }
  );

  it('lets a same-origin login POST through', async () => {
    const res = await run(
      request('/api/auth/login', { method: 'POST', origin: ORIGIN })
    );

    expect(passesThrough(res)).toBe(true);
  });

  it('treats an expired session as no session', async () => {
    const res = await run(request('/', { session: await token(31 * DAY) }));

    expect(getRedirectUrl(res)).toBe(`${ORIGIN}/login?next=%2F`);
  });
});

describe('Origin check on mutations', () => {
  it.each([
    ['a foreign Origin', 'https://evil.example'],
    ['no Origin', undefined],
  ])('rejects a POST with %s, even when logged in', async (_, origin) => {
    const res = await run(
      request('/api/auth/logout', {
        method: 'POST',
        origin,
        session: await token(),
      })
    );

    expect(res.status).toBe(403);
    expect((await res.json()).error.code).toBe('forbidden');
  });

  it('rejects a cross-site login POST', async () => {
    const res = await run(
      request('/api/auth/login', {
        method: 'POST',
        origin: 'https://evil.example',
      })
    );

    expect(res.status).toBe(403);
  });

  it('does not require Origin on GET', async () => {
    const res = await run(request('/api/health'));

    expect(passesThrough(res)).toBe(true);
  });
});

describe('with a session', () => {
  it('lets a fresh session through without touching the cookie', async () => {
    const res = await run(request('/todos', { session: await token() }));

    expect(passesThrough(res)).toBe(true);
    expect(res.headers.get('set-cookie')).toBeNull();
  });

  it('re-issues a session older than 24 hours', async () => {
    const old = await token(2 * DAY);

    const res = await run(request('/', { session: old }));

    expect(passesThrough(res)).toBe(true);
    const fresh = res.cookies.get(SESSION_COOKIE)?.value;
    expect(fresh).toBeDefined();
    expect(fresh).not.toBe(old);
    const session = await verifySession(fresh, getAuthConfig().secret);
    expect(session!.iat).toBeGreaterThan(Date.now() / 1000 - 60);
  });

  it('sends /login back to home', async () => {
    const res = await run(request('/login', { session: await token() }));

    expect(getRedirectUrl(res)).toBe(`${ORIGIN}/`);
  });

  it('lets a same-origin logout through', async () => {
    const res = await run(
      request('/api/auth/logout', {
        method: 'POST',
        origin: ORIGIN,
        session: await token(),
      })
    );

    expect(passesThrough(res)).toBe(true);
  });
});
