import { describe, expect, it } from 'vitest';
import {
  createProjectBody,
  createTodoBody,
  parseProjectFilter,
  updateProjectBody,
  updateTodoBody,
} from './validation';

const ID = '6f1d2c3a-9b4e-4f7a-8c21-0d5e6f7a8b9c';

describe('createTodoBody', () => {
  it('trims the title and allows no project', () => {
    expect(createTodoBody.parse({ title: '  Buy milk ' })).toEqual({
      title: 'Buy milk',
    });
  });

  it('accepts a project id or null', () => {
    expect(createTodoBody.parse({ title: 'A', projectId: ID }).projectId).toBe(
      ID
    );
    expect(
      createTodoBody.parse({ title: 'A', projectId: null }).projectId
    ).toBeNull();
  });

  it.each([
    [{ title: '' }, 'title'],
    [{ title: '   ' }, 'title'],
    [{ title: 'x'.repeat(281) }, 'title'],
    [{ title: 'A', projectId: 'nope' }, 'projectId'],
  ])('rejects %j on %s', (body, field) => {
    const result = createTodoBody.safeParse(body);

    expect(result.success).toBe(false);
    expect(result.error!.issues[0].path).toEqual([field]);
  });
});

describe('link and notes', () => {
  it('normalizes the link and trims the notes', () => {
    expect(
      createTodoBody.parse({
        title: 'A',
        url: 'example.com/page',
        notes: '  remember this  ',
      })
    ).toEqual({
      title: 'A',
      url: 'https://example.com/page',
      notes: 'remember this',
    });
  });

  it.each([
    ['', null],
    ['   ', null],
    [null, null],
  ])('treats the link %j as empty', (url, expected) => {
    expect(updateTodoBody.parse({ url }).url).toBe(expected);
  });

  it.each([
    ['', null],
    ['   ', null],
    [null, null],
  ])('treats the notes %j as empty', (notes, expected) => {
    expect(updateTodoBody.parse({ notes }).notes).toBe(expected);
  });

  it('keeps line breaks inside notes', () => {
    expect(updateTodoBody.parse({ notes: 'a\nb' }).notes).toBe('a\nb');
  });

  it.each(['javascript:alert(1)', 'https://user:pw@example.com'])(
    'rejects the link %j',
    (url) => {
      const result = updateTodoBody.safeParse({ url });

      expect(result.success).toBe(false);
      expect(result.error!.issues[0].path).toEqual(['url']);
    }
  );

  it('rejects notes that are too long', () => {
    const result = updateTodoBody.safeParse({ notes: 'x'.repeat(2001) });

    expect(result.success).toBe(false);
    expect(result.error!.issues[0].path).toEqual(['notes']);
  });

  it('accepts an update of only the link', () => {
    expect(updateTodoBody.safeParse({ url: null }).success).toBe(true);
  });
});

describe('updateTodoBody', () => {
  it.each([
    [{ title: 'New' }],
    [{ projectId: null }],
    [{ completed: true }],
    [{ completed: false }],
  ])('accepts %j', (body) => {
    expect(updateTodoBody.safeParse(body).success).toBe(true);
  });

  it('rejects an empty update', () => {
    expect(updateTodoBody.safeParse({}).success).toBe(false);
  });

  it('rejects a non-boolean completed', () => {
    expect(updateTodoBody.safeParse({ completed: 'yes' }).success).toBe(false);
  });
});

describe('project bodies', () => {
  it('trims the name', () => {
    expect(createProjectBody.parse({ name: '  Work ' })).toEqual({
      name: 'Work',
    });
    expect(updateProjectBody.parse({ name: ' Home ' })).toEqual({
      name: 'Home',
    });
  });

  it.each(['', '   ', 'x'.repeat(51)])('rejects the name %j', (name) => {
    expect(createProjectBody.safeParse({ name }).success).toBe(false);
  });
});

describe('parseProjectFilter', () => {
  it('reads a project id', () => {
    expect(parseProjectFilter(ID)).toEqual({ kind: 'project', id: ID });
  });

  it('reads none', () => {
    expect(parseProjectFilter('none')).toEqual({ kind: 'none' });
  });

  it.each([undefined, '', 'garbage', ['a', 'b']])(
    'treats %j as all',
    (value) => {
      expect(parseProjectFilter(value)).toEqual({ kind: 'all' });
    }
  );
});
