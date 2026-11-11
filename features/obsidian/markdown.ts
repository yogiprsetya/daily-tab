import type { UrlTransform } from 'react-markdown';

/**
 * Only `http` and `https` links become links. Everything else — relative paths,
 * `obsidian://`, `file:`, `javascript:` — becomes plain text, because a note can
 * contain anything and a relative link would point at the app rather than a note.
 */
export const safeUrl: UrlTransform = (url) => {
  try {
    const { protocol } = new URL(url);
    return protocol === 'http:' || protocol === 'https:' ? url : '';
  } catch {
    // Not an absolute URL: a relative path or a wikilink.
    return '';
  }
};
