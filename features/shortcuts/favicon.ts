/** Only the hostname is sent to the favicon service, never the path or query. */
export function faviconUrl(url: string): string | null {
  try {
    const { hostname } = new URL(url);
    return `https://icons.duckduckgo.com/ip3/${hostname}.ico`;
  } catch {
    return null;
  }
}
