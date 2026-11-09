import { describe, expect, it } from 'vitest';
import {
  createBookmarkBody,
  createFolderBody,
  escapeLike,
  parseFolderFilter,
  parseSearch,
  updateBookmarkBody,
} from './validation';

const ID = '6f1d2c3a-9b4e-4f7a-8c21-0d5e6f7a8b9c';

describe('createBookmarkBody', () => {
  it('trims the title, normalizes the URL and treats empty notes as null', () => {
    expect(
      createBookmarkBody.parse({
        title: '  Docs ',
        url: 'example.com/a',
        notes: '   ',
      })
    ).toEqual({ title: 'Docs', url: 'https://example.com/a', notes: null });
  });

  it('accepts a folder id or null', () => {
    const base = { title: 'A', url: 'a.example' };

    expect(createBookmarkBody.parse({ ...base, folderId: ID }).folderId).toBe(
      ID
    );
    expect(
      createBookmarkBody.parse({ ...base, folderId: null }).folderId
    ).toBeNull();
  });

  it.each([
    [{ title: '', url: 'a.example' }, 'title'],
    [{ title: 'x'.repeat(121), url: 'a.example' }, 'title'],
    [{ title: 'A', url: '' }, 'url'],
    [{ title: 'A', url: 'javascript:alert(1)' }, 'url'],
    [{ title: 'A', url: 'a.example', notes: 'x'.repeat(2001) }, 'notes'],
    [{ title: 'A', url: 'a.example', folderId: 'nope' }, 'folderId'],
  ])('rejects %j on %s', (body, field) => {
    const result = createBookmarkBody.safeParse(body);

    expect(result.success).toBe(false);
    expect(result.error!.issues[0].path).toEqual([field]);
  });
});

describe('updateBookmarkBody', () => {
  it('accepts a single field', () => {
    expect(updateBookmarkBody.safeParse({ notes: null }).success).toBe(true);
  });

  it('rejects an empty update', () => {
    expect(updateBookmarkBody.safeParse({}).success).toBe(false);
  });
});

describe('createFolderBody', () => {
  it('trims the name', () => {
    expect(createFolderBody.parse({ name: ' Dev ' })).toEqual({ name: 'Dev' });
  });

  it.each(['', '  ', 'x'.repeat(51)])('rejects the name %j', (name) => {
    expect(createFolderBody.safeParse({ name }).success).toBe(false);
  });
});

describe('parseFolderFilter', () => {
  it('reads a folder id and none', () => {
    expect(parseFolderFilter(ID)).toEqual({ kind: 'folder', id: ID });
    expect(parseFolderFilter('none')).toEqual({ kind: 'none' });
  });

  it.each([undefined, '', 'garbage', ['a']])('treats %j as all', (value) => {
    expect(parseFolderFilter(value)).toEqual({ kind: 'all' });
  });
});

describe('parseSearch', () => {
  it('trims the query', () => {
    expect(parseSearch('  docs ')).toBe('docs');
  });

  it.each([undefined, '', '   ', ['a', 'b']])(
    'treats %j as no search',
    (value) => {
      expect(parseSearch(value)).toBeUndefined();
    }
  );

  it('caps very long queries', () => {
    expect(parseSearch('x'.repeat(300))).toHaveLength(200);
  });
});

describe('escapeLike', () => {
  it('escapes LIKE wildcards and the escape character', () => {
    expect(escapeLike('100%_a\\b')).toBe('100\\%\\_a\\\\b');
  });

  it('leaves ordinary text alone', () => {
    expect(escapeLike('hello world')).toBe('hello world');
  });
});
