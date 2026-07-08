import { indexedCollectionToArray } from '@app/services/ws/util/indexedCollection';
import type { PaintData, PaintLayerData, PaintStop } from '@app/types/seventv/cosmetics';

import {
  getPaintDropShadows,
  getPaintLayers,
  type PaintDropShadowMode,
} from '@app/components/Chat/components/ChatMessage/CosmeticUsername/util/paintLayer';
import {
  getPaintTextShadows,
  getPaintTextStroke,
} from '@app/components/Chat/components/ChatMessage/CosmeticUsername/util/paintTextStyle';

import type {
  NativePaintDefinition,
  NativePaintLayer,
  NativePaintShadow,
  NativePaintStop,
} from './PaintedUsername.types';

function serializeShadow(shadow: {
  color: number;
  radius: number;
  x_offset: number;
  y_offset: number;
}): NativePaintShadow {
  return {
    color: shadow.color,
    radius: shadow.radius,
    x_offset: shadow.x_offset,
    y_offset: shadow.y_offset,
  };
}

function nudgeHardGradientStops(stops: PaintStop[]): NativePaintStop[] {
  let lastStop = -1;

  return stops.map(stop => {
    let at = stop.at;
    if (at <= lastStop) {
      at = lastStop + 0.0000001;
    }
    lastStop = at;

    return at === stop.at
      ? { color: stop.color, at: stop.at }
      : { color: stop.color, at };
  });
}

function serializeLayer(layer: PaintLayerData): NativePaintLayer {
  const stops = nudgeHardGradientStops(
    indexedCollectionToArray(layer.stops)
      .slice()
      .sort((a, b) => a.at - b.at),
  );

  return {
    function: layer.function,
    stops,
    angle: layer.angle ?? 0,
    shape: layer.shape ?? 'circle',
    repeat: layer.repeat ?? false,
    image_url: layer.image_url ?? '',
    canvas_repeat: layer.canvas_repeat ?? 'unset',
    at: layer.at,
    size: layer.size,
    opacity: layer.opacity ?? 1,
  };
}

/**
 * Converts in-memory 7TV paint data into the JSON payload the native view consumes.
 */
export function serializeNativePaintDefinition(
  paint: PaintData,
  dropShadowMode: PaintDropShadowMode,
): NativePaintDefinition {
  const textStyle = paint.textStyle;
  const stroke = getPaintTextStroke(paint);
  const textShadows = getPaintTextShadows(paint);

  return {
    color: paint.color,
    layers: getPaintLayers(paint).map(serializeLayer),
    dropShadows: getPaintDropShadows(paint, dropShadowMode).map(serializeShadow),
    textStyle: textStyle
      ? {
          weight: textStyle.weight,
          transform: textStyle.transform,
          stroke: stroke
            ? { color: stroke.color, width: stroke.width }
            : undefined,
          shadows: textShadows.map(serializeShadow),
        }
      : stroke || textShadows.length > 0
        ? {
            stroke: stroke
              ? { color: stroke.color, width: stroke.width }
              : undefined,
            shadows: textShadows.map(serializeShadow),
          }
        : null,
  };
}
