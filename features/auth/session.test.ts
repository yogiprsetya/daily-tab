import { decodeJwt } from 'jose';
import { describe, expect, it } from 'vitest';
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  clearedSessionCookie,
  needsRefresh,
  sessionCookie,
  signSession,
  verifySession,
} from './session';

const secret = new TextEncoder().encode('a'.repeat(32));
const otherSecret = new TextEncoder().encode('b'.repeat(32));
const now = new Date('2026-11-08T10:00:00Z');
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

describe('signSession / verifySession', () => {
  it('round-trips a session for the owner', async () => {
    const { token } = await signSession(secret, now);

    const session = await verifySession(token, secret, now);

    expect(session).toEqual({
      sub: 'owner',
      iat: now.getTime() / 1000,
      exp: now.getTime() / 1000 + SESSION_TTL_SECONDS,
    });
  });

  it('puts nothing but subject and timestamps in the token', async () => {
    const { token } = await signSession(secret, now);

    expect(Object.keys(decodeJwt(token)).sort()).toEqual(['exp', 'iat', 'sub']);
  });

  it('still accepts a session just before 30 days', async () => {
    const { token } = await signSession(secret, now);
    const later = new Date(now.getTime() + 30 * DAY - 1000);

    expect(await verifySession(token, secret, later)).not.toBeNull();
  });

  it('rejects an expired session', async () => {
    const { token } = await signSession(secret, now);
    const later = new Date(now.getTime() + 31 * DAY);

    expect(await verifySession(token, secret, later)).toBeNull();
  });

  it('rejects a token signed with another secret', async () => {
    const { token } = await signSession(otherSecret, now);

    expect(await verifySession(token, secret, now)).toBeNull();
  });

  it('rejects a tampered token', async () => {
    const { token } = await signSession(secret, now);
    const [header, , signature] = token.split('.');
    const forgedPayload = Buffer.from(
      JSON.stringify({ sub: 'owner', iat: 0, exp: 4_102_444_800 })
    ).toString('base64url');

    expect(
      await verifySession(
        `${header}.${forgedPayload}.${signature}`,
        secret,
        now
      )
    ).toBeNull();
  });

  it.each([undefined, '', 'garbage', 'a.b.c'])('rejects %j', async (token) => {
    expect(await verifySession(token, secret, now)).toBeNull();
  });
});

describe('needsRefresh', () => {
  it('is false for a session younger than 24 hours', async () => {
    const { token } = await signSession(secret, now);
    const session = (await verifySession(token, secret, now))!;

    expect(needsRefresh(session, new Date(now.getTime() + DAY - 60_000))).toBe(
      false
    );
  });

  it('is true for a session older than 24 hours', async () => {
    const { token } = await signSession(secret, now);
    const session = (await verifySession(token, secret, now))!;

    expect(needsRefresh(session, new Date(now.getTime() + DAY + 60_000))).toBe(
      true
    );
  });
});

describe('session cookies', () => {
  it('keeps the cookie lifetime equal to the token lifetime', async () => {
    const { token } = await signSession(secret, now);
    const { iat, exp } = decodeJwt(token);

    expect(exp! - iat!).toBe(SESSION_TTL_SECONDS);
    expect(sessionCookie(token)).toEqual({
      name: SESSION_COOKIE,
      value: token,
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_TTL_SECONDS,
    });
  });

  it('clears the cookie with the same name, path and attributes', () => {
    expect(clearedSessionCookie()).toEqual({
      ...sessionCookie(''),
      maxAge: 0,
    });
  });
});
