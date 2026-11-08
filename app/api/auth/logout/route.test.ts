import { describe, expect, it, vi } from 'vitest';
import { SESSION_COOKIE } from '@/features/auth/session';
import { POST } from './route';

vi.mock('next/server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/server')>()),
  connection: vi.fn(async () => {}),
}));

describe('POST /api/auth/logout', () => {
  it('expires the session cookie', async () => {
    const res = await POST();

    expect(res.status).toBe(200);
    const cookie = res.headers.get('set-cookie')!;
    expect(cookie).toContain(`${SESSION_COOKIE}=;`);
    expect(cookie).toMatch(/Max-Age=0/);
    expect(cookie).toMatch(/Path=\//);
  });
});
