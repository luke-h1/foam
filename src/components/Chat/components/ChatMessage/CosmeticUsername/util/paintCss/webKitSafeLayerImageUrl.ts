/**
 * WKWebView fails some 7TV WebP paints; swap CDN `.webp` → `.avif` sibling.
 */
export function webKitSafeLayerImageUrl(url: string): string {
  return url.replace(
    /^(https:\/\/cdn\.7tv\.app\/paint\/[^?\s]+)\.webp(\?\S*)?$/,
    '$1.avif$2',
  );
}
