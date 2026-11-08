const MAX_URL_LENGTH = 2048;
// `localhost:3000` and `example.com:8080` also look like "scheme:", so a colon
// followed by a digit is read as a port.
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:(?!\d)/i;

/** Returns a canonical http(s) URL, or null if the input is not allowed. */
export function normalizeUrl(input: string): string | null {
  const value = input.trim();
  if (!value) return null;

  let url: URL;
  try {
    url = new URL(HAS_SCHEME.test(value) ? value : `https://${value}`);
  } catch {
    return null;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  if (url.username || url.password) return null;

  const normalized = url.toString();
  return normalized.length <= MAX_URL_LENGTH ? normalized : null;
}

/** Short label for a link: its hostname without `www.`. */
export function displayHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
