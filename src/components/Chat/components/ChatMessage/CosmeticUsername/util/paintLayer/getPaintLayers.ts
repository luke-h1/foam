import { indexedCollectionToArray } from '@app/services/ws/util/indexedCollection';
import type { PaintData, PaintLayerData } from '@app/types/seventv/cosmetics';

// A paint is shared by paint_id across every user wearing it (mirroring the
// 7TV extension, which builds one CSS rule per paint and reuses it for all
// users). These derivations are pure functions of the paint, so memoise them
// on the paint object - every painted row that shares a paint then reuses the
// same computed layers/gradient configs instead of rebuilding them per render.
// WeakMap-keyed so entries drop with the paint object; no eviction needed.
const paintLayersCache = new WeakMap<PaintData, PaintLayerData[]>();

export function getPaintLayers(paint: PaintData): PaintLayerData[] {
  const cached = paintLayersCache.get(paint);
  if (cached) {
    return cached;
  }
  const layers = computePaintLayers(paint);
  paintLayersCache.set(paint, layers);
  return layers;
}

function computePaintLayers(paint: PaintData): PaintLayerData[] {
  const layers = indexedCollectionToArray(paint.layers);
  if (layers.length > 0) {
    return layers;
  }

  if (
    paint.function === 'LINEAR_GRADIENT' &&
    (!paint.stops || paint.stops.length === 0) &&
    paint.color === null
  ) {
    return [];
  }

  return [
    {
      function: paint.function,
      stops: paint.stops ?? { length: 0 },
      angle: paint.angle ?? 0,
      shape: paint.shape ?? 'circle',
      repeat: paint.repeat ?? false,
      image_url: paint.image_url ?? '',
      canvas_repeat: 'unset',
      at: null,
      size: null,
    },
  ];
}
