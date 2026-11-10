// What the toolbar button sends and shows. No Chrome APIs here, so it can be tested.

const MAX_TITLE = 120;

/** The reading-list request for a tab, or null for a page that cannot be saved. */
export function saveRequest({ title, url }) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;

  return { title: cutTitle(title?.trim() || parsed.hostname), url };
}

function cutTitle(title) {
  let cut = title.slice(0, MAX_TITLE);
  // Never end on half of a surrogate pair, such as an emoji.
  if (/[\uD800-\uDBFF]$/.test(cut)) cut = cut.slice(0, -1);
  return cut.trimEnd();
}

const BADGES = {
  201: { ok: true, text: '✓', tooltip: 'Saved to reading list' },
  409: { ok: true, text: '✓', tooltip: 'Already on your reading list' },
  401: { ok: false, text: '!', tooltip: 'Sign in to Daily Tab first' },
  400: { ok: false, text: '!', tooltip: "This page can't be saved" },
};
const FAILED = { ok: false, text: '!', tooltip: 'Could not save. Try again.' };

/** Badge for an HTTP status from the API; 0 stands for a network error. */
export function badgeFor(status) {
  return BADGES[status] ?? FAILED;
}
