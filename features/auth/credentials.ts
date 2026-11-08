import { createHash, timingSafeEqual } from 'node:crypto';

// Hashing first gives equal-length buffers, so timingSafeEqual never throws
// and the comparison time does not depend on how much of the input matched.
const digest = (value: string) => createHash('sha256').update(value).digest();

const sameValue = (a: string, b: string) =>
  timingSafeEqual(digest(a), digest(b));

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export function checkCredentials(
  input: { email: string; pin: string },
  expected: { email: string; pin: string }
): boolean {
  // Evaluate both before combining: no early exit that reveals which one failed.
  const emailMatches = sameValue(
    normalizeEmail(input.email),
    normalizeEmail(expected.email)
  );
  const pinMatches = sameValue(input.pin, expected.pin);
  return emailMatches && pinMatches;
}
