import type { PaintLayerData } from '@app/types/seventv/cosmetics';

/**
 * Whether a paint layer produces a span at all; drops layers with nothing to
 * draw and fully transparent layers.
 */
export function isRenderablePaintLayer(layer: PaintLayerData): boolean {
  if (layer.opacity <= 0) {
    return false;
  }
  if (layer.function === 'URL') {
    return Boolean(layer.image_url);
  }
  return layer.stops.length > 0;
}
