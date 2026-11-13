import { describe, expect, it } from 'vitest';
import { checkCredentials } from './credentials';

const expected = { pin: '482913' };

describe('checkCredentials', () => {
  it('accepts the configured PIN', () => {
    expect(checkCredentials({ pin: '482913' }, expected)).toBe(true);
  });

  it.each([
    ['wrong PIN', { pin: '482914' }],
    ['shorter PIN', { pin: '48291' }],
    ['longer PIN', { pin: '4829130' }],
    ['PIN with spaces', { pin: ' 482913' }],
    ['empty input', { pin: '' }],
  ])('rejects %s', (_, input) => {
    expect(checkCredentials(input, expected)).toBe(false);
  });
});
