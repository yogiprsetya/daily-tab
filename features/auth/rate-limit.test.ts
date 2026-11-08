import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/db';
import { checkLoginAllowed, pruneAttempts, recordAttempt } from './rate-limit';
import { loginAttempts } from './schema';

const now = new Date('2026-11-08T10:00:00Z');
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60_000);

async function fail(ip: string, at: Date, times = 1) {
  for (let i = 0; i < times; i++) await recordAttempt(ip, false, at);
}

beforeEach(async () => {
  await db.execute(sql`truncate ${loginAttempts}`);
});

describe('per-IP limit (5 failures / 15 minutes)', () => {
  it('allows an IP with 4 recent failures', async () => {
    await fail('203.0.113.1', minutesAgo(1), 4);

    expect(await checkLoginAllowed('203.0.113.1', now)).toEqual({
      allowed: true,
    });
  });

  it('blocks after the 5th failure until the oldest leaves the window', async () => {
    await fail('203.0.113.1', minutesAgo(10));
    await fail('203.0.113.1', minutesAgo(2), 4);

    expect(await checkLoginAllowed('203.0.113.1', now)).toEqual({
      allowed: false,
      retryAfterSeconds: 5 * 60,
    });
  });

  it('only limits the offending IP', async () => {
    await fail('203.0.113.1', minutesAgo(1), 5);

    expect(await checkLoginAllowed('198.51.100.9', now)).toEqual({
      allowed: true,
    });
  });

  it('ignores failures older than 15 minutes', async () => {
    await fail('203.0.113.1', minutesAgo(16), 5);

    expect(await checkLoginAllowed('203.0.113.1', now)).toEqual({
      allowed: true,
    });
  });

  it('never counts successful logins', async () => {
    for (let i = 0; i < 5; i++) {
      await recordAttempt('203.0.113.1', true, minutesAgo(1));
    }

    expect(await checkLoginAllowed('203.0.113.1', now)).toEqual({
      allowed: true,
    });
  });
});

describe('global limit (20 failures / 60 minutes)', () => {
  it('blocks every IP once 20 failures come from many IPs', async () => {
    for (let i = 0; i < 20; i++) {
      await fail(`192.0.2.${i}`, minutesAgo(50 - i));
    }

    expect(await checkLoginAllowed('198.51.100.9', now)).toEqual({
      allowed: false,
      retryAfterSeconds: 10 * 60,
    });
  });

  it('allows again once failures age past 60 minutes', async () => {
    for (let i = 0; i < 20; i++) await fail(`192.0.2.${i}`, minutesAgo(61));

    expect(await checkLoginAllowed('198.51.100.9', now)).toEqual({
      allowed: true,
    });
  });
});

describe('pruneAttempts', () => {
  it('deletes attempts older than 24 hours only', async () => {
    await fail('203.0.113.1', minutesAgo(24 * 60 + 1));
    await fail('203.0.113.1', minutesAgo(24 * 60 - 1));

    await pruneAttempts(now);

    const rows = await db.select().from(loginAttempts);
    expect(rows).toHaveLength(1);
  });
});
