import type { PaintData, PaintShadow } from '@app/types/seven-tv/cosmetics';
import { indexedCollectionToArray } from '@app/utils/collection/indexedCollection';

const textShadowsCache = new WeakMap<PaintData, PaintShadow[]>();

export function getPaintTextShadows(paint: PaintData): PaintShadow[] {
  const cached = textShadowsCache.get(paint);

  if (cached) {
    return cached;
  }

  const shadows = paint.textStyle?.shadows;
  const result = shadows ? indexedCollectionToArray(shadows) : [];
  textShadowsCache.set(paint, result);
  return result;
}
