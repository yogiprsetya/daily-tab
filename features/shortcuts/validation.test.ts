import { describe, expect, it } from 'vitest';
import {
  createShortcutBody,
  moveShortcutBody,
  normalizeUrl,
  updateShortcutBody,
} from './validation';

describe('normalizeUrl', () => {
  it.each([
    ['github.com', 'https://github.com/'],
    ['  github.com/owner  ', 'https://github.com/owner'],
    ['https://example.com/a?b=1#c', 'https://example.com/a?b=1#c'],
    ['http://example.com', 'http://example.com/'],
    ['HTTPS://EXAMPLE.com', 'https://example.com/'],
    ['localhost:3000', 'https://localhost:3000/'],
    ['example.com:8080/path', 'https://example.com:8080/path'],
  ])('turns %j into %j', (input, output) => {
    expect(normalizeUrl(input)).toBe(output);
  });

  it.each([
    '',
    '   ',
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    'data:text/html,hi',
    'ftp://example.com',
    'mailto:me@example.com',
    'https://user:pass@example.com',
    'https://user@example.com',
    'has spaces.com',
    `https://example.com/${'a'.repeat(2050)}`,
  ])('rejects %j', (input) => {
    expect(normalizeUrl(input)).toBeNull();
  });
});

describe('createShortcutBody', () => {
  it('trims the title and normalizes the URL', () => {
    expect(
      createShortcutBody.parse({ title: '  GitHub ', url: 'github.com' })
    ).toEqual({ title: 'GitHub', url: 'https://github.com/' });
  });

  it.each([
    [{ title: '', url: 'github.com' }, 'title'],
    [{ title: '   ', url: 'github.com' }, 'title'],
    [{ title: 'x'.repeat(81), url: 'github.com' }, 'title'],
    [{ title: 'Bad', url: 'javascript:alert(1)' }, 'url'],
  ])('rejects %j on %s', (body, field) => {
    const result = createShortcutBody.safeParse(body);

    expect(result.success).toBe(false);
    expect(result.error!.issues[0].path).toEqual([field]);
  });
});

describe('updateShortcutBody', () => {
  it('accepts a single field', () => {
    expect(updateShortcutBody.parse({ title: 'New' })).toEqual({
      title: 'New',
    });
  });

  it('rejects an empty update', () => {
    expect(updateShortcutBody.safeParse({}).success).toBe(false);
  });
});

describe('moveShortcutBody', () => {
  it('accepts only up and down', () => {
    expect(moveShortcutBody.safeParse({ direction: 'up' }).success).toBe(true);
    expect(moveShortcutBody.safeParse({ direction: 'left' }).success).toBe(
      false
    );
  });
});
