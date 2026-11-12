import { beforeEach, describe, expect, it, vi } from 'vitest';

const { revalidateTag } = vi.hoisted(() => ({
  revalidateTag: vi.fn(),
}));

vi.mock('next/cache', () => ({ revalidateTag }));

import { DATA_TAGS, invalidateData } from './server-cache';

describe('invalidateData', () => {
  beforeEach(() => {
    revalidateTag.mockClear();
  });

  it('expires every requested data group immediately', () => {
    invalidateData('todos', 'projects');

    expect(revalidateTag).toHaveBeenCalledTimes(2);
    expect(revalidateTag).toHaveBeenNthCalledWith(1, DATA_TAGS.todos, {
      expire: 0,
    });
    expect(revalidateTag).toHaveBeenNthCalledWith(2, DATA_TAGS.projects, {
      expire: 0,
    });
  });

  it('does not invalidate unrelated data groups', () => {
    invalidateData('shortcuts');

    expect(revalidateTag).toHaveBeenCalledOnce();
    expect(revalidateTag).toHaveBeenCalledWith(DATA_TAGS.shortcuts, {
      expire: 0,
    });
  });

  it('invalidates each requested group', () => {
    invalidateData('bookmarks', 'bookmarks');

    expect(revalidateTag).toHaveBeenCalledOnce();
    expect(revalidateTag).toHaveBeenCalledWith(DATA_TAGS.bookmarks, {
      expire: 0,
    });
  });
});
