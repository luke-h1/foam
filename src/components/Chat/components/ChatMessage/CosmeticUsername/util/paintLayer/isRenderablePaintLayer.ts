import type { PaintLayerData } from '@app/types/seventv/cosmetics';

/**
 * Whether a paint layer produces a span at all. The reference drops layers
 * with nothing to draw (no texture url, no gradient stops) and we also skip
 * fully transparent layers, which render as nothing.
 */
export function isRenderablePaintLayer(layer: PaintLayerData): boolean {
  if ((layer.opacity ?? 1) <= 0) {
    return false;
  }
  if (layer.function === 'URL') {
    return Boolean(layer.image_url);
  }
  return layer.stops.length > 0;
}
