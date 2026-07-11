import type { IndexedCollection } from '@app/services/ws/util/indexedCollection';
import type {
  PaintCanvasRepeat,
  PaintData,
  PaintFunction,
  PaintLayerData,
  PaintShadow,
  PaintShape,
  PaintStop,
  PaintTextStyle,
} from '@app/types/seventv/cosmetics';

import { get7TvCosmeticId } from './get7TvCosmeticId';
import type { PaintGradientLayer, RawSevenTvPaintInput } from './types';

function isPaintGradientArray(
  gradients: RawSevenTvPaintInput['gradients'],
): gradients is PaintGradientLayer[] {
  return Array.isArray(gradients) && gradients.length > 0;
}

function stopsToIndexed(
  stops: IndexedCollection<PaintStop> | PaintStop[] | undefined,
): IndexedCollection<PaintStop> {
  if (!stops) {
    return { length: 0 };
  }

  if (Array.isArray(stops)) {
    const indexed: IndexedCollection<PaintStop> = { length: stops.length };
    stops.forEach((stop, index) => {
      indexed[index] = stop;
    });
    return indexed;
  }

  return stops;
}

function canvasRepeatToRepeat(canvasRepeat?: string): boolean {
  if (
    !canvasRepeat ||
    canvasRepeat === 'unset' ||
    canvasRepeat === 'no-repeat'
  ) {
    return false;
  }

  return true;
}

const PAINT_CANVAS_REPEAT_VALUES = new Set<PaintCanvasRepeat>([
  '',
  'no-repeat',
  'repeat',
  'repeat-x',
  'repeat-y',
  'round',
  'space',
  'revert',
  'unset',
]);

function isPaintCanvasRepeat(value: string): value is PaintCanvasRepeat {
  return PAINT_CANVAS_REPEAT_VALUES.has(value as PaintCanvasRepeat);
}

function normalizeCanvasRepeat(canvasRepeat?: string): PaintCanvasRepeat {
  if (!canvasRepeat || !isPaintCanvasRepeat(canvasRepeat)) {
    return 'unset';
  }

  return canvasRepeat;
}

function normalizePaintLayer(layer: PaintGradientLayer): PaintLayerData {
  const shape: PaintShape = layer.shape === 'ellipse' ? 'ellipse' : 'circle';
  const repeat =
    layer.function === 'URL'
      ? canvasRepeatToRepeat(layer.canvas_repeat)
      : (layer.repeat ?? false);

  return {
    function: layer.function,
    stops: stopsToIndexed(layer.stops),
    angle: layer.angle ?? 0,
    shape,
    repeat,
    image_url: layer.image_url ?? '',
    canvas_repeat: normalizeCanvasRepeat(layer.canvas_repeat),
    at: layer.at && layer.at.length === 2 ? [layer.at[0], layer.at[1]] : null,
    size:
      layer.size && layer.size.length === 2
        ? [layer.size[0], layer.size[1]]
        : null,
  };
}

function layersToIndexed(
  layers: PaintGradientLayer[],
): IndexedCollection<PaintLayerData> {
  const indexed: IndexedCollection<PaintLayerData> = { length: layers.length };
  layers.forEach((layer, index) => {
    indexed[index] = normalizePaintLayer(layer);
  });
  return indexed;
}

function parsePaintTextStyle(text: unknown): PaintTextStyle | null {
  if (!text || typeof text !== 'object') {
    return null;
  }

  const value = text as Record<string, unknown>;
  const style: PaintTextStyle = {};

  if (typeof value.weight === 'number') {
    style.weight = value.weight;
  }

  if (value.transform === 'uppercase' || value.transform === 'lowercase') {
    style.transform = value.transform;
  }

  if (value.stroke && typeof value.stroke === 'object') {
    const stroke = value.stroke as Record<string, unknown>;
    if (typeof stroke.color === 'number' && typeof stroke.width === 'number') {
      style.stroke = { color: stroke.color, width: stroke.width };
    }
  }

  if (value.shadows) {
    if (Array.isArray(value.shadows)) {
      const shadows: IndexedCollection<PaintShadow> = {
        length: value.shadows.length,
      };
      value.shadows.forEach((shadow, index) => {
        if (shadow && typeof shadow === 'object') {
          const entry = shadow as Record<string, unknown>;
          shadows[index] = {
            color: entry.color as number,
            radius: (entry.radius as number) ?? 0,
            x_offset: (entry.x_offset as number) ?? 0,
            y_offset: (entry.y_offset as number) ?? 0,
          };
        }
      });
      style.shadows = shadows;
    } else if (typeof value.shadows === 'object') {
      style.shadows = value.shadows as IndexedCollection<PaintShadow>;
    }
  }

  return Object.keys(style).length > 0 ? style : null;
}

function syncFlatFieldsFromLayer(
  layer: PaintLayerData,
): Pick<
  PaintData,
  'function' | 'repeat' | 'angle' | 'shape' | 'image_url' | 'stops'
> {
  return {
    function: layer.function,
    repeat: layer.repeat,
    angle: layer.angle,
    shape: layer.shape,
    image_url: layer.image_url,
    stops: layer.stops,
  };
}

export function normalizeSevenTvPaint(raw: RawSevenTvPaintInput): PaintData {
  const id = get7TvCosmeticId(raw);
  const textStyle =
    parsePaintTextStyle(raw.textStyle ?? (raw as { text?: unknown }).text) ??
    null;

  let sourceLayers: PaintGradientLayer[] = [];

  if (isPaintGradientArray(raw.gradients)) {
    sourceLayers = raw.gradients;
  } else if (raw.function) {
    sourceLayers = [
      {
        function: raw.function,
        canvas_repeat: '',
        size: [1, 1],
        shape: raw.shape,
        image_url: raw.image_url,
        stops: raw.stops,
        repeat: raw.repeat ?? false,
        angle: raw.angle,
      },
    ];
  } else if (raw.layers && raw.layers.length > 0) {
    return {
      id,
      name: raw.name ?? '',
      color: raw.color ?? null,
      layers: raw.layers,
      shadows: raw.shadows ?? { length: 0 },
      textStyle,
      function: raw.function ?? 'LINEAR_GRADIENT',
      repeat: raw.repeat ?? false,
      angle: raw.angle ?? 0,
      shape: raw.shape ?? 'circle',
      image_url: raw.image_url ?? '',
      stops: raw.stops ?? { length: 0 },
    };
  }

  if (sourceLayers.length === 0) {
    return {
      id,
      name: raw.name ?? '',
      color: raw.color ?? null,
      layers: { length: 0 },
      shadows: raw.shadows ?? { length: 0 },
      textStyle,
      function: 'LINEAR_GRADIENT',
      repeat: false,
      angle: 0,
      shape: 'circle',
      image_url: '',
      stops: { length: 0 },
    };
  }

  const layers = layersToIndexed(sourceLayers);
  const primary = layers[0];
  const flat = primary
    ? syncFlatFieldsFromLayer(primary)
    : {
        function: 'LINEAR_GRADIENT' as PaintFunction,
        repeat: false,
        angle: 0,
        shape: 'circle' as PaintShape,
        image_url: '',
        stops: { length: 0 } as IndexedCollection<PaintStop>,
      };

  return {
    id,
    name: raw.name ?? '',
    color: raw.color ?? null,
    layers,
    shadows: raw.shadows ?? { length: 0 },
    textStyle,
    ...flat,
  };
}
