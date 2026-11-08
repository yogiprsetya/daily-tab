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

const folderId = z.uuid('Choose a valid folder').nullable();

const name = z
  .string()
  .trim()
  .min(1, 'Enter a name')
  .max(50, 'Name is too long');

export const createBookmarkBody = z.object({
  title,
  url,
  notes: notes.optional(),
  folderId: folderId.optional(),
});

export const updateBookmarkBody = z
  .object({
    title: title.optional(),
    url: url.optional(),
    notes: notes.optional(),
    folderId: folderId.optional(),
  })
  .refine((body) => Object.values(body).some((value) => value !== undefined), {
    message: 'Nothing to update',
  });

export const createFolderBody = z.object({ name });
export const updateFolderBody = z.object({ name });

export type FolderFilter =
  { kind: 'all' } | { kind: 'none' } | { kind: 'folder'; id: string };

/** `?folder=` value: a folder id, `none`, or anything else meaning All. */
export function parseFolderFilter(
  value: string | string[] | undefined
): FolderFilter {
  if (value === 'none') return { kind: 'none' };
  if (typeof value === 'string' && z.uuid().safeParse(value).success) {
    return { kind: 'folder', id: value };
  }
  return { kind: 'all' };
}

const MAX_SEARCH_LENGTH = 200;

export function parseSearch(
  value: string | string[] | undefined
): string | undefined {
  if (typeof value !== 'string') return undefined;
  return value.trim().slice(0, MAX_SEARCH_LENGTH) || undefined;
}

/** Makes `%`, `_` and `\` match literally inside a LIKE pattern. */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}
