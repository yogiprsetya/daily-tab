import { describe, expect, it } from 'vitest';
import { parseAuthConfig } from './config';

const valid = {
  AUTH_EMAIL: 'owner@example.com',
  AUTH_PIN: '482913',
  AUTH_SECRET: 'x'.repeat(32),
};

describe('parseAuthConfig', () => {
  it('returns the email, PIN and the secret as bytes', () => {
    const config = parseAuthConfig(valid);

    expect(config.email).toBe('owner@example.com');
    expect(config.pin).toBe('482913');
    expect(config.secret).toEqual(new TextEncoder().encode('x'.repeat(32)));
  });

  it('accepts PINs longer than 6 digits', () => {
    expect(parseAuthConfig({ ...valid, AUTH_PIN: '48291377' }).pin).toBe(
      '48291377'
    );
  });

  it.each([
    ['AUTH_EMAIL', { AUTH_EMAIL: undefined }],
    ['AUTH_EMAIL', { AUTH_EMAIL: 'not-an-email' }],
    ['AUTH_PIN', { AUTH_PIN: undefined }],
    ['AUTH_PIN', { AUTH_PIN: '12345' }],
    ['AUTH_PIN', { AUTH_PIN: '12a456' }],
    ['AUTH_SECRET', { AUTH_SECRET: undefined }],
    ['AUTH_SECRET', { AUTH_SECRET: 'too-short' }],
  ])('names %s when it is invalid', (name, override) => {
    expect(() => parseAuthConfig({ ...valid, ...override })).toThrow(name);
  });

  it('never puts the provided values in the error', () => {
    const secretish = {
      AUTH_EMAIL: 'leak@',
      AUTH_PIN: '98a7',
      AUTH_SECRET: 's3cr3t',
    };

    try {
      parseAuthConfig(secretish);
      expect.unreachable();
    } catch (error) {
      const message = (error as Error).message;
      for (const value of Object.values(secretish)) {
        expect(message).not.toContain(value);
      }
    }
  });
});
