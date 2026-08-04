/**
 * 7TV's v3 cosmetic payloads carry scheme-relative CDN urls
 * (`//cdn.7tv.app/badge/<id>`). A browser resolves those against the page;
 * NSURL does not, so expo-image drops them with no visible error.
 */
export function absoluteSevenTvUrl(url: string): string {
  return url.startsWith('//') ? `https:${url}` : url;
}
