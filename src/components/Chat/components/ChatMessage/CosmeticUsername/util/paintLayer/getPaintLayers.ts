// "shape" is the 7TV paint API field (types/seventv/cosmetics.ts), not a naming choice.
// oxlint-disable anti-slop/no-shape-in-symbol-names
import { indexedCollectionToArray } from '@app/services/ws/util/indexedCollection';
import type { PaintData, PaintLayerData } from '@app/types/seventv/cosmetics';

// A paint is shared across every user wearing it (the extension builds one
// CSS rule per paint), so memoise pure derivations on the paint object;
// WeakMap-keyed so entries drop with the paint.
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
      opacity: 1,
    },
  ];
}
