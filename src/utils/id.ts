/**
 * ID utilities
 * Prefer crypto.randomUUID when available; fall back to timestamp + random.
 */
export function generateId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    try {
      return crypto.randomUUID();
    } catch {
      // ignore and use fallback
    }
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
