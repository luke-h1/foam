import { indexedCollectionToArray } from '@app/services/ws/util/indexedCollection';
import type { PaintData, PaintStop } from '@app/types/seventv/cosmetics';
import { isVisibleSevenTvColor } from '@app/utils/color/isVisibleSevenTvColor';
import { sevenTvColorToCss } from '@app/utils/color/sevenTvColorToCss';

import { getPaintLayers } from './getPaintLayers';
import { isRenderablePaintLayer } from './isRenderablePaintLayer';

// Memoised on the paint object; WeakMap-keyed so entries drop with the paint.
const solidColorCache = new WeakMap<PaintData, string | null>();

/**
 * The one colour that stands in when a paint's layer stack cannot be drawn;
 * null for a bare texture, leaving the caller's fallback in place.
 */
export function getPaintSolidColor(paint: PaintData): string | null {
  const cached = solidColorCache.get(paint);
  if (cached !== undefined) {
    return cached;
  }
  const color = computePaintSolidColor(paint);
  solidColorCache.set(paint, color);
  return color;
}

function computePaintSolidColor(paint: PaintData): string | null {
  if (isVisibleSevenTvColor(paint.color)) {
    return sevenTvColorToCss(paint.color);
  }

  // getPaintLayers orders topmost first, which is the layer the eye reads.
  for (const layer of getPaintLayers(paint)) {
    if (!isRenderablePaintLayer(layer)) {
      continue;
    }
    const stop = midStop(indexedCollectionToArray(layer.stops));
    if (stop) {
      return sevenTvColorToCss(stop.color);
    }
  }

  return null;
}

function midStop(stops: PaintStop[]): PaintStop | null {
  return stops.reduce<PaintStop | null>((best, stop) => {
    if (!isVisibleSevenTvColor(stop.color)) {
      return best;
    }
    if (!best || Math.abs(stop.at - 0.5) < Math.abs(best.at - 0.5)) {
      return stop;
    }
    return best;
  }, null);
}
