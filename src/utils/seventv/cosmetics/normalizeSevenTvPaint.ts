// `shape` here mirrors the 7TV paint API field name, not a naming choice.
// oxlint-disable anti-slop/no-shape-in-symbol-names
import type { IndexedCollection } from '@app/services/ws/util/indexedCollection';
import type {
  PaintCanvasRepeat,
  PaintData,
  PaintLayerData,
  PaintShadow,
  PaintShape,
  PaintStop,
  PaintTextStyle,
  SevenTvColor,
} from '@app/types/seventv/cosmetics';

import { absoluteSevenTvUrl } from './absoluteSevenTvUrl';
import { get7TvCosmeticId } from './get7TvCosmeticId';
import type { PaintGradientLayer, RawSevenTvPaintInput } from './types';

interface RawPaintTextStrokeInput {
  color?: SevenTvColor;
  width?: number;
}

interface RawPaintShadowInput {
  color: SevenTvColor;
  radius?: number;
  x_offset?: number;
  y_offset?: number;
}

interface RawPaintTextStyleInput {
  weight?: number;
  transform?: string;
  stroke?: RawPaintTextStrokeInput | null;
  shadows?: RawPaintShadowInput[] | IndexedCollection<PaintShadow> | null;
}

type NormalizeSevenTvPaintInput = RawSevenTvPaintInput & {
  text?: RawPaintTextStyleInput | null;
};

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

const PAINT_CANVAS_REPEAT_VALUES: ReadonlySet<string> =
  new Set<PaintCanvasRepeat>([
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
  return PAINT_CANVAS_REPEAT_VALUES.has(value);
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
    image_url: absoluteSevenTvUrl(layer.image_url ?? ''),
    canvas_repeat: normalizeCanvasRepeat(layer.canvas_repeat),
    at: layer.at && layer.at.length === 2 ? [layer.at[0], layer.at[1]] : null,
    size:
      layer.size && layer.size.length === 2
        ? [layer.size[0], layer.size[1]]
        : null,
    opacity: layer.opacity ?? 1,
  };
}

/**
 * Already-shaped layers (an MMKV rehydrate) skip normalizePaintLayer, so they
 * need the same url repair.
 */
function withAbsoluteLayerImageUrls(
  layers: IndexedCollection<PaintLayerData>,
): IndexedCollection<PaintLayerData> {
  const repaired: IndexedCollection<PaintLayerData> = { length: layers.length };
  for (let index = 0; index < layers.length; index += 1) {
    const layer = layers[index];
    if (layer) {
      repaired[index] = {
        ...layer,
        image_url: absoluteSevenTvUrl(layer.image_url ?? ''),
      };
    }
  }
  return repaired;
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

function parsePaintTextStyle(
  text: RawPaintTextStyleInput | null | undefined,
): PaintTextStyle | null {
  if (!text) {
    return null;
  }

  const style: PaintTextStyle = {};

  if (text.weight !== undefined) {
    style.weight = text.weight;
  }

  if (text.transform === 'uppercase' || text.transform === 'lowercase') {
    style.transform = text.transform;
  }

  if (
    text.stroke &&
    text.stroke.color !== undefined &&
    text.stroke.width !== undefined
  ) {
    style.stroke = { color: text.stroke.color, width: text.stroke.width };
  }

  if (text.shadows) {
    if (Array.isArray(text.shadows)) {
      const shadows: IndexedCollection<PaintShadow> = {
        length: text.shadows.length,
      };
      text.shadows.forEach((shadow, index) => {
        if (shadow) {
          shadows[index] = {
            color: shadow.color,
            radius: shadow.radius ?? 0,
            x_offset: shadow.x_offset ?? 0,
            y_offset: shadow.y_offset ?? 0,
          };
        }
      });
      style.shadows = shadows;
    } else {
      style.shadows = text.shadows;
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

export function normalizeSevenTvPaint(
  raw: NormalizeSevenTvPaintInput,
): PaintData {
  const id = get7TvCosmeticId(raw);
  const textStyle = parsePaintTextStyle(raw.textStyle ?? raw.text);

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
      layers: withAbsoluteLayerImageUrls(raw.layers),
      shadows: raw.shadows ?? { length: 0 },
      textStyle,
      function: raw.function ?? 'LINEAR_GRADIENT',
      repeat: raw.repeat ?? false,
      angle: raw.angle ?? 0,
      shape: raw.shape ?? 'circle',
      image_url: absoluteSevenTvUrl(raw.image_url ?? ''),
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
  const flat: Pick<
    PaintData,
    'function' | 'repeat' | 'angle' | 'shape' | 'image_url' | 'stops'
  > = primary
    ? syncFlatFieldsFromLayer(primary)
    : {
        function: 'LINEAR_GRADIENT',
        repeat: false,
        angle: 0,
        shape: 'circle',
        image_url: '',
        stops: { length: 0 },
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
