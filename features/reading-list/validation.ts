import { z } from 'zod';
import { normalizeUrl } from '@/lib/url';

const title = z
  .string()
  .trim()
  .min(1, 'Enter a title')
  .max(120, 'Title is too long');

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

const notes = z
  .string()
  .trim()
  .max(2000, 'Note is too long')
  .nullable()
  .transform((value) => value || null);

const topicId = z.uuid('Choose a valid topic').nullable();

const name = z
  .string()
  .trim()
  .min(1, 'Enter a name')
  .max(50, 'Name is too long');

export const createReadingItemBody = z.object({
  title,
  url,
  notes: notes.optional(),
  topicId: topicId.optional(),
});

export const updateReadingItemBody = z
  .object({
    title: title.optional(),
    url: url.optional(),
    notes: notes.optional(),
    topicId: topicId.optional(),
    read: z.boolean().optional(),
  })
  .refine((body) => Object.values(body).some((value) => value !== undefined), {
    message: 'Nothing to update',
  });

export const createTopicBody = z.object({ name });
export const updateTopicBody = z.object({ name });

export type TopicFilter =
  { kind: 'all' } | { kind: 'none' } | { kind: 'topic'; id: string };

/** `?topic=` value: a topic id, `none`, or anything else meaning All. */
export function parseTopicFilter(
  value: string | string[] | undefined
): TopicFilter {
  if (value === 'none') return { kind: 'none' };
  if (typeof value === 'string' && z.uuid().safeParse(value).success) {
    return { kind: 'topic', id: value };
  }
  return { kind: 'all' };
}
