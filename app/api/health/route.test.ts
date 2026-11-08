import { afterEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/db';
import { GET } from './route';

// `connection()` needs a Next.js request scope; outside one it throws.
vi.mock('next/server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/server')>()),
  connection: vi.fn(async () => {}),
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe('GET /api/health', () => {
  it('returns 200 ok when the database answers', async () => {
    const res = await GET();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok', db: 'ok' });
  });

  it('returns 503 when the database is unreachable', async () => {
    vi.spyOn(db, 'execute').mockRejectedValueOnce(new Error('ECONNREFUSED'));

    const res = await GET();

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ status: 'error', db: 'unreachable' });
  });
});
