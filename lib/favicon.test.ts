import { describe, expect, it } from 'vitest';
import { faviconUrl } from './favicon';

describe('faviconUrl', () => {
  it('uses only the hostname', () => {
    expect(
      faviconUrl('https://github.com/owner/private-repo?token=abc#x')
    ).toBe('https://icons.duckduckgo.com/ip3/github.com.ico');
  });

  it('drops the port', () => {
    expect(faviconUrl('http://example.com:8080/')).toBe(
      'https://icons.duckduckgo.com/ip3/example.com.ico'
    );
  });

  it('returns null for an unparsable URL', () => {
    expect(faviconUrl('not a url')).toBeNull();
  });
});
