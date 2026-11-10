import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  EXTENSION_ORIGIN,
  clientIp,
  isAllowedMutation,
  isSameOrigin,
  safeNextPath,
} from './request';

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

describe('EXTENSION_ORIGIN', () => {
  it('matches the id fixed by the extension manifest key', () => {
    const { key } = JSON.parse(readFileSync('extension/manifest.json', 'utf8'));
    // Chrome's id: the first 32 hex digits of the key's SHA-256, mapped 0-f to a-p.
    const id = createHash('sha256')
      .update(Buffer.from(key, 'base64'))
      .digest('hex')
      .slice(0, 32)
      .replace(/[0-9a-f]/g, (digit) => 'abcdefghijklmnop'[parseInt(digit, 16)]);

    expect(EXTENSION_ORIGIN).toBe(`chrome-extension://${id}`);
  });
});

describe('isAllowedMutation', () => {
  const app = 'https://daily-tab.vercel.app';
  const from = (origin?: string) =>
    new Headers(origin ? { origin } : undefined);

  it.each([
    ['POST', '/api/reading-items'],
    ['PATCH', '/api/todos/1'],
    ['DELETE', '/api/auth/logout'],
  ])('allows the app itself on %s %s', (method, path) => {
    expect(isAllowedMutation(method, path, from(app), app)).toBe(true);
  });

  it('allows the extension to save to the reading list', () => {
    expect(
      isAllowedMutation(
        'POST',
        '/api/reading-items',
        from(EXTENSION_ORIGIN),
        app
      )
    ).toBe(true);
  });

  it.each([
    ['PATCH', '/api/reading-items/1'],
    ['DELETE', '/api/reading-items/1'],
    ['POST', '/api/reading-items/1'],
    ['POST', '/api/reading-items/'],
    ['POST', '/api/reading-topics'],
    ['POST', '/api/auth/logout'],
    ['PUT', '/api/reading-items'],
  ])('rejects the extension on %s %s', (method, path) => {
    expect(isAllowedMutation(method, path, from(EXTENSION_ORIGIN), app)).toBe(
      false
    );
  });

  it.each([
    ['another site', 'https://evil.example'],
    [
      'another extension',
      'chrome-extension://abcdefghijklmnopabcdefghijklmnop',
    ],
    ['no Origin', undefined],
  ])('rejects %s on the reading list', (_, origin) => {
    expect(
      isAllowedMutation('POST', '/api/reading-items', from(origin), app)
    ).toBe(false);
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
