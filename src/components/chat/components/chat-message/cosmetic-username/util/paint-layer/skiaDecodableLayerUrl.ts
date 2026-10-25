/**
 * Skia decodes WebP but not AVIF, so swap 7TV CDN AVIF layer urls to their
 * WebP sibling (same path, always served).
 */
export function skiaDecodableLayerUrl(url: string): string {
  return url.replace(
    /^(https:\/\/cdn\.7tv\.app\/paint\/[^?\s]+)\.avif(\?\S*)?$/,
    '$1.webp$2',
  );
}
