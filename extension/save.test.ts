import { describe, expect, it } from 'vitest';
import { badgeFor, saveRequest } from './save.js';

describe('saveRequest', () => {
  it('sends the tab title and URL', () => {
    expect(
      saveRequest({ title: '  An article ', url: 'https://a.example/post' })
    ).toEqual({ title: 'An article', url: 'https://a.example/post' });
  });

  it('cuts the title to 120 characters', () => {
    const { title } = saveRequest({
      title: 'x'.repeat(200),
      url: 'https://a.example/',
    })!;

    expect(title).toHaveLength(120);
  });

  it('does not end the cut title on half an emoji', () => {
    const { title } = saveRequest({
      title: `${'x'.repeat(119)}😀 and more`,
      url: 'https://a.example/',
    })!;

    expect(title).toBe('x'.repeat(119));
  });

  it('does not end the cut title on a space', () => {
    const { title } = saveRequest({
      title: `${'x'.repeat(119)} y`,
      url: 'https://a.example/',
    })!;

    expect(title).toBe('x'.repeat(119));
  });

  it.each([undefined, '', '   '])(
    'falls back to the hostname for the title %j',
    (title) => {
      expect(
        saveRequest({ title, url: 'https://www.a.example/post' })?.title
      ).toBe('www.a.example');
    }
  );

  it('accepts plain http', () => {
    expect(
      saveRequest({ title: 'A', url: 'http://a.example/' })
    ).not.toBeNull();
  });

  it.each([
    'chrome://newtab/',
    'chrome-extension://abc/newtab.html',
    'file:///home/me/notes.txt',
    'about:blank',
    'not a url',
    undefined,
  ])('produces no request for %j', (url) => {
    expect(saveRequest({ title: 'A', url })).toBeNull();
  });
});

describe('badgeFor', () => {
  it.each([
    [201, '✓', 'Saved to reading list'],
    [409, '✓', 'Already on your reading list'],
    [401, '!', 'Sign in to Daily Tab first'],
    [400, '!', "This page can't be saved"],
    [500, '!', 'Could not save. Try again.'],
    [403, '!', 'Could not save. Try again.'],
    [0, '!', 'Could not save. Try again.'],
  ])('shows %s as %s with "%s"', (status, text, tooltip) => {
    expect(badgeFor(status)).toMatchObject({ text, tooltip });
  });

  it('marks only saved and already-saved as success', () => {
    expect(badgeFor(201).ok).toBe(true);
    expect(badgeFor(409).ok).toBe(true);
    expect(badgeFor(401).ok).toBe(false);
  });
});
