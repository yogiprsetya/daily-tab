import { NextResponse, connection } from 'next/server';
import { z } from 'zod';
import { getAuthConfig } from '@/features/auth/config';
import { checkCredentials } from '@/features/auth/credentials';
import {
  checkLoginAllowed,
  pruneAttempts,
  recordAttempt,
} from '@/features/auth/rate-limit';
import { clientIp } from '@/features/auth/request';
import { sessionCookie, signSession } from '@/features/auth/session';
import { apiError, parseBody } from '@/lib/api';

const loginBody = z.object({
  email: z.string().max(320),
  pin: z.string().max(64),
});

export async function POST(request: Request) {
  await connection();

  const body = await parseBody(request, loginBody);
  if (!body.ok) return body.response;

  const ip = clientIp(request.headers);
  const now = new Date();
  await pruneAttempts(now);

  const decision = await checkLoginAllowed(ip, now);
  if (!decision.allowed) {
    // Not recorded and credentials not compared while limited.
    const res = apiError('rate_limited', 'Too many attempts. Try again later.');
    res.headers.set('Retry-After', String(decision.retryAfterSeconds));
    return res;
  }

  const config = getAuthConfig();
  const valid = checkCredentials(body.data, config);
  await recordAttempt(ip, valid, now);

  if (!valid) return apiError('unauthorized', 'Email or PIN is incorrect');

  const { token } = await signSession(config.secret, now);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(sessionCookie(token));
  return res;
}
