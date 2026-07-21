/**
 * 7TV hosts advertise protocol-relative URLs (`//cdn.7tv.app/...`); iOS rejects
 * scheme-less URLs with NSURLError -1100 before any request is made. Anything
 * that isn't https after normalization (http, file, data, ...) is rejected so
 * a hostile cosmetics payload can't smuggle other schemes into image sources.
 */
export function ensureHttpsUrl(url: string): string {
  const withScheme = url.startsWith('//') ? `https:${url}` : url;
  if (/^https:\/\//i.test(withScheme)) {
    return withScheme;
  }
  if (/^http:\/\//i.test(withScheme)) {
    return withScheme.replace(/^http:/i, 'https:');
  }
  return '';
}
