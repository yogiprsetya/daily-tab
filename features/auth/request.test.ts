import { describe, expect, it } from 'vitest';
import { clientIp, isSameOrigin, safeNextPath } from './request';

describe('clientIp', () => {
  it('takes the first x-forwarded-for entry', () => {
    const headers = new Headers({
      'x-forwarded-for': '203.0.113.7, 10.0.0.1',
      'x-real-ip': '10.0.0.2',
    });

    expect(clientIp(headers)).toBe('203.0.113.7');
  });

  it('falls back to x-real-ip, then "unknown"', () => {
    expect(clientIp(new Headers({ 'x-real-ip': '198.51.100.4' }))).toBe(
      '198.51.100.4'
    );
    expect(clientIp(new Headers())).toBe('unknown');
    expect(clientIp(new Headers({ 'x-forwarded-for': ' , ' }))).toBe('unknown');
  });
});

describe('safeNextPath', () => {
  it.each([
    ['/todos', '/todos'],
    ['/todos?project=home#top', '/todos?project=home#top'],
    ['/', '/'],
  ])('keeps the same-origin path %s', (input, output) => {
    expect(safeNextPath(input)).toBe(output);
  });

  it.each([
    null,
    undefined,
    '',
    'todos',
    '//evil.example',
    '/\\evil.example',
    '\\\\evil.example',
    'https://evil.example/todos',
    'javascript:alert(1)',
    '/%0d%0aSet-Cookie:x',
    '/login',
    '/login?next=/todos',
  ])('falls back to / for %j', (input) => {
    expect(safeNextPath(input)).toBe('/');
  });
});

describe('isSameOrigin', () => {
  const app = 'https://daily-tab.vercel.app';

  it('accepts the app origin', () => {
    expect(isSameOrigin(new Headers({ origin: app }), app)).toBe(true);
  });

  it.each([
    ['missing Origin', new Headers()],
    ['another site', new Headers({ origin: 'https://evil.example' })],
    ['http downgrade', new Headers({ origin: 'http://daily-tab.vercel.app' })],
    ['opaque origin', new Headers({ origin: 'null' })],
  ])('rejects %s', (_, headers) => {
    expect(isSameOrigin(headers, app)).toBe(false);
  });
});
