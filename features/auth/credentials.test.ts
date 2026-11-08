import { describe, expect, it } from 'vitest';
import { checkCredentials } from './credentials';

const expected = { email: 'owner@example.com', pin: '482913' };

describe('checkCredentials', () => {
  it('accepts the configured email and PIN', () => {
    expect(
      checkCredentials({ email: 'owner@example.com', pin: '482913' }, expected)
    ).toBe(true);
  });

  it('ignores email case and surrounding whitespace', () => {
    expect(
      checkCredentials(
        { email: '  Owner@Example.COM ', pin: '482913' },
        expected
      )
    ).toBe(true);
  });

  it.each([
    ['wrong email', { email: 'someone@example.com', pin: '482913' }],
    ['wrong PIN', { email: 'owner@example.com', pin: '482914' }],
    ['shorter PIN', { email: 'owner@example.com', pin: '48291' }],
    ['longer PIN', { email: 'owner@example.com', pin: '4829130' }],
    ['PIN with spaces', { email: 'owner@example.com', pin: ' 482913' }],
    ['empty input', { email: '', pin: '' }],
  ])('rejects %s', (_, input) => {
    expect(checkCredentials(input, expected)).toBe(false);
  });
});
