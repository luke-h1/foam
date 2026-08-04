/**
 * 7TV's v3 payloads (EventAPI cosmetics, emote sets) carry protocol-relative
 * CDN urls - `//cdn.7tv.app/badge/<id>`. A browser resolves those against the
 * page scheme; NSURL/OkHttp do not, so expo-image drops them without a visible
 * error (Sentry FOAM-TV-MOBILE, NSURL -1100). Every url taken from a 7TV
 * payload goes through here before it reaches an image loader.
 */
export function absoluteSevenTvUrl(url: string): string {
  return url.startsWith('//') ? `https:${url}` : url;
}
