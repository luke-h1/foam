import type { PaintData } from '@app/types/seventv/cosmetics';
import { isVisibleSevenTvColor } from '@app/utils/color/isVisibleSevenTvColor';

import { getPaintLayers } from './getPaintLayers';
import { isRenderablePaintLayer } from './isRenderablePaintLayer';

export function paintDependsOnTexture(paint: PaintData): boolean {
  if (isVisibleSevenTvColor(paint.color)) {
    return false;
  }

  const layers = getPaintLayers(paint).filter(isRenderablePaintLayer);
  return layers.length > 0 && layers.every(layer => layer.function === 'URL');
}

export function getPaintTextureUrl(paint: PaintData): string | null {
  for (const layer of getPaintLayers(paint)) {
    if (
      isRenderablePaintLayer(layer) &&
      layer.function === 'URL' &&
      layer.image_url
    ) {
      return layer.image_url;
    }
  }
  return null;
}
