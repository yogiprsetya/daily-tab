import { describe, expect, it } from 'vitest';
import { bookmarksHref } from './href';

describe('bookmarksHref', () => {
  it('leaves out empty values', () => {
    expect(bookmarksHref(null, undefined)).toBe('/bookmarks');
    expect(bookmarksHref(null, '')).toBe('/bookmarks');
  });

  it('combines the folder and the search', () => {
    expect(bookmarksHref('none', 'react')).toBe(
      '/bookmarks?folder=none&q=react'
    );
  });

  it('encodes the search text', () => {
    expect(bookmarksHref(null, '100% a&b')).toBe('/bookmarks?q=100%25+a%26b');
  });
});
