import type { PaintData } from '@app/utils/color/seventv-ws-service';
import {
  buildLayerGradientConfig,
  getPaintLayers,
  type LayerGradientConfig,
} from './paintLayer';

export type GradientConfig = LayerGradientConfig;

export function buildGradientConfig(
  paint: PaintData,
  fallbackColor: string,
): GradientConfig {
  const [primaryLayer] = getPaintLayers(paint);
  if (!primaryLayer) {
    return buildLayerGradientConfig(
      {
        function: 'LINEAR_GRADIENT',
        stops: { length: 0 },
        angle: paint.angle ?? 0,
        shape: paint.shape ?? 'circle',
        repeat: paint.repeat ?? false,
        image_url: paint.image_url ?? '',
        canvas_repeat: 'unset',
        at: null,
        size: null,
      },
      fallbackColor,
    );
  }

  return buildLayerGradientConfig(primaryLayer, fallbackColor);
}
