import { z } from 'zod';
import { normalizeUrl } from '@/lib/url';

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
