import type { PaintData, PaintShadow } from '@app/types/seven-tv/cosmetics';
import { indexedCollectionToArray } from '@app/utils/collection/indexedCollection';

const paintDropShadowsCache = new WeakMap<PaintData, PaintShadow[]>();

/**
 * Every drop shadow on the paint. This matches the extension's default
 * `dropShadowRender` setting, which draws all shadows.
 */
export function getPaintDropShadows(paint: PaintData): PaintShadow[] {
  const cached = paintDropShadowsCache.get(paint);

  if (cached) {
    return cached;
  }

  const shadows = indexedCollectionToArray(paint.shadows);
  paintDropShadowsCache.set(paint, shadows);
  return shadows;
}
