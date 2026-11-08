import { SignJWT, jwtVerify } from 'jose';

// Pure helpers shared by proxy.ts and Route Handlers (no `next/headers` here).

export const SESSION_COOKIE = 'dt_session';
export const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;
/** Sliding expiry: re-issue the token once it is older than this. */
export const REFRESH_AFTER_SECONDS = 24 * 60 * 60;

const SUBJECT = 'owner';
const ALG = 'HS256';

export type Session = { sub: typeof SUBJECT; iat: number; exp: number };

export type SessionCookie = {
  name: string;
  value: string;
  httpOnly: true;
  secure: true;
  sameSite: 'lax';
  path: '/';
  maxAge: number;
};

const toSeconds = (date: Date) => Math.floor(date.getTime() / 1000);

export async function signSession(
  secret: Uint8Array,
  now: Date = new Date()
): Promise<{ token: string }> {
  const iat = toSeconds(now);
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: ALG })
    .setSubject(SUBJECT)
    .setIssuedAt(iat)
    .setExpirationTime(iat + SESSION_TTL_SECONDS)
    .sign(secret);
  return { token };
}

export async function verifySession(
  token: string | undefined,
  secret: Uint8Array,
  now: Date = new Date()
): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: [ALG],
      subject: SUBJECT,
      currentDate: now,
      requiredClaims: ['iat', 'exp'],
    });
    return { sub: SUBJECT, iat: payload.iat!, exp: payload.exp! };
  } catch {
    return null;
  }
}

export function needsRefresh(session: Session, now: Date = new Date()) {
  return toSeconds(now) - session.iat > REFRESH_AFTER_SECONDS;
}

export function sessionCookie(token: string): SessionCookie {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  };
}

export function clearedSessionCookie(): SessionCookie {
  return { ...sessionCookie(''), maxAge: 0 };
}
