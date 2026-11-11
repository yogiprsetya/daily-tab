import { describe, expect, it } from 'vitest';
import { safeUrl } from './markdown';

/** `safeUrl` only reads the URL; the other two arguments exist for react-markdown. */
const url = (value: string) => safeUrl(value, 'href', {} as never);

describe('safeUrl', () => {
  it('keeps http and https links', () => {
    expect(url('https://example.com/a?b=1#c')).toBe(
      'https://example.com/a?b=1#c'
    );
    expect(url('http://example.com')).toBe('http://example.com');
  });

  it.each([
    ['obsidian://open?vault=x', 'an Obsidian URL'],
    ['javascript:alert(1)', 'a javascript URL'],
    ['file:///etc/passwd', 'a file URL'],
    ['mailto:me@example.com', 'mailto'],
    ['./other-note.md', 'a relative path'],
    ['other-note.md', 'a bare relative path'],
    ['/absolute/path', 'an absolute path'],
    ['#heading', 'a fragment'],
    ['my note', 'a wikilink without a scheme'],
  ])('drops %s (%s)', (value) => {
    expect(url(value)).toBe('');
  });
});
