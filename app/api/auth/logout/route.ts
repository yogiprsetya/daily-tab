import { NextResponse, connection } from 'next/server';
import { clearedSessionCookie } from '@/features/auth/session';

export async function POST() {
  await connection();

  const res = NextResponse.json({ ok: true });
  res.cookies.set(clearedSessionCookie());
  return res;
}
