import { describe, expect, it } from 'vitest';
import {
  createReadingItemBody,
  createTopicBody,
  parseTopicFilter,
  updateReadingItemBody,
  updateTopicBody,
} from './validation';

const ID = '6f1d2c3a-9b4e-4f7a-8c21-0d5e6f7a8b9c';

describe('createReadingItemBody', () => {
  it('trims the title, normalizes the URL and treats empty notes as null', () => {
    expect(
      createReadingItemBody.parse({
        title: '  Article ',
        url: 'example.com/a',
        notes: '   ',
      })
    ).toEqual({
      title: 'Article',
      url: 'https://example.com/a',
      notes: null,
    });
  });

  it('accepts a topic id or null', () => {
    const base = { title: 'A', url: 'a.example' };

    expect(createReadingItemBody.parse({ ...base, topicId: ID }).topicId).toBe(
      ID
    );
    expect(
      createReadingItemBody.parse({ ...base, topicId: null }).topicId
    ).toBeNull();
  });

  it('accepts a title of 120 characters and a note of 2000', () => {
    const body = {
      title: 'x'.repeat(120),
      url: 'a.example',
      notes: 'y'.repeat(2000),
    };

    expect(createReadingItemBody.safeParse(body).success).toBe(true);
  });

  it.each([
    [{ title: '', url: 'a.example' }, 'title'],
    [{ title: '   ', url: 'a.example' }, 'title'],
    [{ title: 'x'.repeat(121), url: 'a.example' }, 'title'],
    [{ title: 'A', url: '' }, 'url'],
    [{ title: 'A', url: 'javascript:alert(1)' }, 'url'],
    [{ title: 'A', url: 'ftp://a.example' }, 'url'],
    [{ title: 'A', url: 'https://user:secret@a.example' }, 'url'],
    [{ title: 'A', url: 'a.example', notes: 'x'.repeat(2001) }, 'notes'],
    [{ title: 'A', url: 'a.example', topicId: 'nope' }, 'topicId'],
  ])('rejects %j on %s', (body, field) => {
    const result = createReadingItemBody.safeParse(body);

    expect(result.success).toBe(false);
    expect(result.error!.issues[0].path).toEqual([field]);
  });

  it('ignores read, which only an update can set', () => {
    expect(
      createReadingItemBody.parse({ title: 'A', url: 'a.example', read: true })
    ).not.toHaveProperty('read');
  });
});

describe('updateReadingItemBody', () => {
  it('accepts a single field', () => {
    expect(updateReadingItemBody.safeParse({ notes: null }).success).toBe(true);
  });

  it.each([true, false])('accepts read: %s on its own', (read) => {
    expect(updateReadingItemBody.parse({ read })).toEqual({ read });
  });

  it('rejects a read value that is not a boolean', () => {
    expect(updateReadingItemBody.safeParse({ read: 'yes' }).success).toBe(
      false
    );
  });

  it('rejects an empty update', () => {
    expect(updateReadingItemBody.safeParse({}).success).toBe(false);
  });
});

describe.each([
  ['createTopicBody', createTopicBody],
  ['updateTopicBody', updateTopicBody],
])('%s', (_label, schema) => {
  it('trims the name', () => {
    expect(schema.parse({ name: ' Dev ' })).toEqual({ name: 'Dev' });
  });

  it.each(['', '  ', 'x'.repeat(51)])('rejects the name %j', (name) => {
    expect(schema.safeParse({ name }).success).toBe(false);
  });
});

describe('parseTopicFilter', () => {
  it('reads a topic id and none', () => {
    expect(parseTopicFilter(ID)).toEqual({ kind: 'topic', id: ID });
    expect(parseTopicFilter('none')).toEqual({ kind: 'none' });
  });

  it.each([undefined, '', 'garbage', ['a']])('treats %j as all', (value) => {
    expect(parseTopicFilter(value)).toEqual({ kind: 'all' });
  });
});
