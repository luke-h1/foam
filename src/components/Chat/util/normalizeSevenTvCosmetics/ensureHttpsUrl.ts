/**
 * 7TV hosts advertise protocol-relative URLs (`//cdn.7tv.app/...`); iOS rejects
 * scheme-less URLs with NSURLError -1100 before any request is made.
 */
export function ensureHttpsUrl(url: string): string {
  return url.startsWith('//') ? `https:${url}` : url;
}
