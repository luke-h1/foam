import type { PaintLayerData } from '@app/types/seven-tv/cosmetics';

export function isRenderablePaintLayer(layer: PaintLayerData): boolean {
  if (layer.opacity <= 0) {
    return false;
  }

  if (layer.function === 'URL') {
    return Boolean(layer.image_url);
  }

  return layer.stops.length > 0;
}
