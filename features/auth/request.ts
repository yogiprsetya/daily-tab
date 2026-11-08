// Request helpers shared by proxy.ts and Route Handlers.

export function clientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (forwarded) return forwarded;
  return headers.get('x-real-ip')?.trim() || 'unknown';
}

const PLACEHOLDER_ORIGIN = 'http://next.invalid';

/**
 * Only same-origin relative paths survive; anything else (absolute URLs,
 * protocol-relative `//host`, backslash tricks, control characters, the login
 * page itself) becomes `/`. Prevents open redirects after login.
 */
export function safeNextPath(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/';
  if (/[\\\u0000-\u001f]/.test(value) || /%0[0-9a-f]|%1[0-9a-f]/i.test(value)) {
    return '/';
  }

  const url = new URL(value, PLACEHOLDER_ORIGIN);
  if (url.origin !== PLACEHOLDER_ORIGIN || url.pathname === '/login')
    return '/';

  return `${url.pathname}${url.search}${url.hash}`;
}

export function isSameOrigin(headers: Headers, appOrigin: string): boolean {
  return headers.get('origin') === appOrigin;
}
