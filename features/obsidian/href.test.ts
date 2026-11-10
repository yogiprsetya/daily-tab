import { describe, expect, it } from 'vitest';
import { obsidianHref } from './href';

describe('obsidianHref', () => {
  it('points at the vault root without a value', () => {
    expect(obsidianHref({})).toBe('/obsidian');
    expect(obsidianHref({ folder: '' })).toBe('/obsidian');
  });

  it('links a folder and a note', () => {
    expect(obsidianHref({ folder: 'projects/archive' })).toBe(
      '/obsidian?folder=projects%2Farchive'
    );
    expect(obsidianHref({ note: 'projects/Plan.md' })).toBe(
      '/obsidian?note=projects%2FPlan.md'
    );
  });

  it('encodes names with spaces, # and &', () => {
    expect(obsidianHref({ note: 'Q&A #1/Read me.md' })).toBe(
      '/obsidian?note=Q%26A+%231%2FRead+me.md'
    );
  });
});
