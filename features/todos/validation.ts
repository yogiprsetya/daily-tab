import { z } from 'zod';
import { normalizeUrl } from '@/lib/url';

const title = z
  .string()
  .trim()
  .min(1, 'Enter a title')
  .max(280, 'Title is too long');

const projectId = z.uuid('Choose a valid project').nullable();

const name = z
  .string()
  .trim()
  .min(1, 'Enter a name')
  .max(50, 'Name is too long');

// Both are optional on a todo: empty input clears them.
const url = z
  .string()
  .nullable()
  .transform((value, ctx) => {
    if (value === null || value.trim() === '') return null;
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
  .max(2000, 'Notes are too long')
  .nullable()
  .transform((value) => value || null);

export const createTodoBody = z.object({
  title,
  projectId: projectId.optional(),
  url: url.optional(),
  notes: notes.optional(),
});

export const updateTodoBody = z
  .object({
    title: title.optional(),
    projectId: projectId.optional(),
    url: url.optional(),
    notes: notes.optional(),
    completed: z.boolean().optional(),
  })
  .refine((body) => Object.values(body).some((value) => value !== undefined), {
    message: 'Nothing to update',
  });

export const createProjectBody = z.object({ name });
export const updateProjectBody = z.object({ name });

export type ProjectFilter =
  { kind: 'all' } | { kind: 'none' } | { kind: 'project'; id: string };

/** `?project=` value: a project id, `none`, or anything else meaning All. */
export function parseProjectFilter(
  value: string | string[] | undefined
): ProjectFilter {
  if (value === 'none') return { kind: 'none' };
  if (typeof value === 'string' && z.uuid().safeParse(value).success) {
    return { kind: 'project', id: value };
  }
  return { kind: 'all' };
}
