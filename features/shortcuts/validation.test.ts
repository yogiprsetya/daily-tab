import { describe, expect, it } from 'vitest';
import {
  createShortcutBody,
  moveShortcutBody,
  updateShortcutBody,
} from './validation';

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
