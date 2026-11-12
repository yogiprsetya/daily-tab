import { describe, expect, it } from 'vitest';
import { featureKey, filterValue, keyPath, queryPath } from './keys';

describe('featureKey', () => {
  it('carries the feature and the request path', () => {
    expect(featureKey('todos', 0, '/api/todos')).toEqual([
      'todos',
      0,
      '/api/todos',
    ]);
  });

  it('gives a new epoch a new key, so the old cache entry is not reused', () => {
    expect(featureKey('todos', 0, '/api/todos')).not.toEqual(
      featureKey('todos', 1, '/api/todos')
    );
  });

  it('separates features that request the same path', () => {
    expect(featureKey('todos', 0, '/api/todos')).not.toEqual(
      featureKey('projects', 0, '/api/todos')
    );
  });

  it('separates two filters of the same feature', () => {
    expect(featureKey('todos', 0, '/api/todos?project=none')).not.toEqual(
      featureKey('todos', 0, '/api/todos')
    );
  });
});

describe('keyPath', () => {
  it('reads the request path out of a key', () => {
    expect(keyPath(featureKey('todos', 3, '/api/todos?project=none'))).toBe(
      '/api/todos?project=none'
    );
  });

  it('passes a plain string key through, as SWR also allows', () => {
    expect(keyPath('/api/shortcuts')).toBe('/api/shortcuts');
  });
});

describe('queryPath', () => {
  it('adds the query when a value is present', () => {
    expect(queryPath('/api/todos', { project: 'abc' })).toBe(
      '/api/todos?project=abc'
    );
  });

  it('leaves the path alone for the All case', () => {
    expect(queryPath('/api/todos', { project: '' })).toBe('/api/todos');
  });

  it('keeps several values in their given order', () => {
    expect(queryPath('/api/bookmarks', { folder: 'f1', q: 'a b' })).toBe(
      '/api/bookmarks?folder=f1&q=a+b'
    );
  });
});

describe('filterValue', () => {
  it('sends the group id when one is selected', () => {
    expect(filterValue({ kind: 'project', id: 'abc' })).toBe('abc');
    expect(filterValue({ kind: 'none' })).toBe('none');
  });

  it('sends nothing for All, so the request carries no filter', () => {
    expect(filterValue({ kind: 'all' })).toBe('');
  });
});
