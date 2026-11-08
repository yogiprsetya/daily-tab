import { z } from 'zod';

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

export const createTodoBody = z.object({
  title,
  projectId: projectId.optional(),
});

export const updateTodoBody = z
  .object({
    title: title.optional(),
    projectId: projectId.optional(),
    completed: z.boolean().optional(),
  })
  .refine(
    (body) =>
      body.title !== undefined ||
      body.projectId !== undefined ||
      body.completed !== undefined,
    { message: 'Nothing to update' }
  );

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
