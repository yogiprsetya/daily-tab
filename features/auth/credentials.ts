import { createHash, timingSafeEqual } from 'node:crypto';

// Hashing first gives equal-length buffers, so timingSafeEqual never throws
// and the comparison time does not depend on how much of the input matched.
const digest = (value: string) => createHash('sha256').update(value).digest();

const sameValue = (a: string, b: string) =>
  timingSafeEqual(digest(a), digest(b));

export function checkCredentials(
  input: { pin: string },
  expected: { pin: string }
): boolean {
  return sameValue(input.pin, expected.pin);
}
