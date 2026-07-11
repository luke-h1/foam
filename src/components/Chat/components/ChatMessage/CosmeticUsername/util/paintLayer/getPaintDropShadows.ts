import { indexedCollectionToArray } from '@app/services/ws/util/indexedCollection';
import type { PaintData, PaintShadow } from '@app/types/seventv/cosmetics';

import { DEFAULT_PAINT_DROP_SHADOW_MODE } from './DEFAULT_PAINT_DROP_SHADOW_MODE';

/**
 * Mirrors the extension's `dropShadowRender` setting: 0 = no shadows,
 * 1 = first shadow only, 2 = all shadows.
 */
export type PaintDropShadowMode = 0 | 1 | 2;

const paintDropShadowsCache = new WeakMap<PaintData, PaintShadow[]>();

function getAllPaintDropShadows(paint: PaintData): PaintShadow[] {
  const cached = paintDropShadowsCache.get(paint);
  if (cached) {
    return cached;
  }
  const shadows = indexedCollectionToArray(paint.shadows);
  paintDropShadowsCache.set(paint, shadows);
  return shadows;
}

export function getPaintDropShadows(
  paint: PaintData,
  mode: PaintDropShadowMode = DEFAULT_PAINT_DROP_SHADOW_MODE,
): PaintShadow[] {
  if (mode === 0) {
    return [];
  }

  const shadows = getAllPaintDropShadows(paint);
  if (mode === 1) {
    return shadows.slice(0, 1);
  }

  return shadows;
}
