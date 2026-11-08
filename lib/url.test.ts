import { describe, expect, it } from 'vitest';
import { displayHost, normalizeUrl } from './url';

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

describe('displayHost', () => {
  it('shows the hostname without www', () => {
    expect(displayHost('https://www.example.com/a?b=1')).toBe('example.com');
    expect(displayHost('https://docs.example.com/')).toBe('docs.example.com');
  });

  it('falls back to the input when it cannot be parsed', () => {
    expect(displayHost('not a url')).toBe('not a url');
  });
});
