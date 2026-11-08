import { describe, expect, it } from 'vitest';
import { NAV_ITEMS, isActive } from './nav-items';

describe('isActive', () => {
  it('matches home only on the exact root path', () => {
    expect(isActive('/', '/')).toBe(true);
    expect(isActive('/', '/todos')).toBe(false);
  });

  it('matches a section and its nested routes', () => {
    expect(isActive('/todos', '/todos')).toBe(true);
    expect(isActive('/todos', '/todos/123')).toBe(true);
  });

  it('does not match a different section sharing a prefix', () => {
    expect(isActive('/todos', '/todos-archive')).toBe(false);
  });
});

describe('NAV_ITEMS', () => {
  it('lists the five destinations from the spec, in order', () => {
    expect(NAV_ITEMS.map((item) => item.href)).toEqual([
      '/',
      '/todos',
      '/bookmarks',
      '/reading-list',
      '/obsidian',
    ]);
  });
});
