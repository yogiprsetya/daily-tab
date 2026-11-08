import { z } from 'zod';

const MAX_URL_LENGTH = 2048;
// `localhost:3000` and `example.com:8080` also look like "scheme:", so a colon
// followed by a digit is read as a port.
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:(?!\d)/i;

/** Returns a canonical http(s) URL, or null if the input is not allowed. */
export function normalizeUrl(input: string): string | null {
  const value = input.trim();
  if (!value) return null;

  let url: URL;
  try {
    url = new URL(HAS_SCHEME.test(value) ? value : `https://${value}`);
  } catch {
    return null;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  if (url.username || url.password) return null;

  const normalized = url.toString();
  return normalized.length <= MAX_URL_LENGTH ? normalized : null;
}

const title = z
  .string()
  .trim()
  .min(1, 'Enter a title')
  .max(80, 'Title is too long');

const url = z.string().transform((value, ctx) => {
  const normalized = normalizeUrl(value);
  if (normalized === null) {
    ctx.addIssue({
      code: 'custom',
      message: 'Enter a valid http or https URL',
    });
    return z.NEVER;
  }
  return normalized;
});

export const createShortcutBody = z.object({ title, url });

export const updateShortcutBody = z
  .object({ title: title.optional(), url: url.optional() })
  .refine((body) => body.title !== undefined || body.url !== undefined, {
    message: 'Nothing to update',
  });

export const moveShortcutBody = z.object({
  direction: z.enum(['up', 'down']),
});
