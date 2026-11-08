import 'server-only';
import { and, count, eq, gte, lt, min } from 'drizzle-orm';
import { db } from '@/db';
import { loginAttempts } from './schema';

const MINUTE = 60_000;

/** Per IP: 5 failures within 15 minutes. */
export const IP_LIMIT = { max: 5, windowMs: 15 * MINUTE };
/** Any IP: 20 failures within 60 minutes. Caps guessing from rotating IPs. */
export const GLOBAL_LIMIT = { max: 20, windowMs: 60 * MINUTE };
const RETENTION_MS = 24 * 60 * MINUTE;

export type LoginDecision =
  { allowed: true } | { allowed: false; retryAfterSeconds: number };

async function recentFailures(now: Date, windowMs: number, ip?: string) {
  const since = new Date(now.getTime() - windowMs);
  const [row] = await db
    .select({ total: count(), oldest: min(loginAttempts.createdAt) })
    .from(loginAttempts)
    .where(
      and(
        eq(loginAttempts.succeeded, false),
        gte(loginAttempts.createdAt, since),
        ip === undefined ? undefined : eq(loginAttempts.ip, ip)
      )
    );
  return row;
}

async function check(
  now: Date,
  limit: typeof IP_LIMIT,
  ip?: string
): Promise<LoginDecision> {
  const { total, oldest } = await recentFailures(now, limit.windowMs, ip);
  if (total < limit.max || !oldest) return { allowed: true };

  // Allowed again once the oldest counted failure leaves the window.
  const reopensAt = new Date(oldest).getTime() + limit.windowMs;
  return {
    allowed: false,
    retryAfterSeconds: Math.max(
      1,
      Math.ceil((reopensAt - now.getTime()) / 1000)
    ),
  };
}

export async function checkLoginAllowed(
  ip: string,
  now: Date = new Date()
): Promise<LoginDecision> {
  const perIp = await check(now, IP_LIMIT, ip);
  if (!perIp.allowed) return perIp;
  return check(now, GLOBAL_LIMIT);
}

export async function recordAttempt(
  ip: string,
  succeeded: boolean,
  now: Date = new Date()
) {
  await db.insert(loginAttempts).values({ ip, succeeded, createdAt: now });
}

export async function pruneAttempts(now: Date = new Date()) {
  await db
    .delete(loginAttempts)
    .where(lt(loginAttempts.createdAt, new Date(now.getTime() - RETENTION_MS)));
}
