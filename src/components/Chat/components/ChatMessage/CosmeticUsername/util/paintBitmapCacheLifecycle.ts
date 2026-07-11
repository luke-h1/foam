/**
 * Skia paint bitmap cache lives here so `clearImageCache` can empty it without
 * importing the Skia rasterizer (keeps web / non-skia bundles free of that
 * dependency). Values are `PaintBitmaps` from the rasterizer.
 */
export const MAX_CACHED_PAINT_BITMAPS = 256;

export const paintBitmapCache = new Map<string, unknown>();

/**
 * Drop cached paint bitmaps (session reset / clear image cache).
 */
export function clearPaintBitmapCache(): void {
  paintBitmapCache.clear();
}
