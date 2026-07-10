import { StyleSheet, type ViewStyle } from 'react-native';

import { indexedCollectionToArray } from '@app/services/ws/util/indexedCollection';
import type {
  PaintCanvasRepeat,
  PaintData,
  PaintLayerData,
  PaintShadow,
  PaintStop,
} from '@app/types/seventv/cosmetics';
import { sevenTvColorToCss } from '@app/utils/color/sevenTvColorToCss';

import { angleToPoints } from './angleToPoints';

export interface LayerGradientConfig {
  colors: string[];
  locations: number[];
  start: { x: number; y: number };
  end: { x: number; y: number };
}

// A paint is shared by paint_id across every user wearing it (mirroring the
// 7TV extension, which builds one CSS rule per paint and reuses it for all
// users). These derivations are pure functions of the paint, so memoise them
// on the paint object — every painted row that shares a paint then reuses the
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

export function paintShadowKey(shadow: PaintShadow): string {
  return `paint-drop-shadow-${shadow.color}-${shadow.x_offset}-${shadow.y_offset}-${shadow.radius}`;
}

/**
 * Mirrors the extension's `dropShadowRender` setting: 0 = no shadows,
 * 1 = first shadow only, 2 = all shadows.
 */
export type PaintDropShadowMode = 0 | 1 | 2;

export const DEFAULT_PAINT_DROP_SHADOW_MODE = 2 as const;

const paintDropShadowsCache = new WeakMap<PaintData, PaintShadow[]>();

function getAllPaintDropShadows(paint: PaintData): PaintShadow[] {
  const cached = paintDropShadowsCache.get(paint);
  if (cached) {
    return cached;
  }
  const shadows = indexedCollectionToArray(paint.shadows);
  paintDropShadowsCache.set(paint, shadows);
  return shadows;
}

export function getPaintDropShadows(
  paint: PaintData,
  mode: PaintDropShadowMode = DEFAULT_PAINT_DROP_SHADOW_MODE,
): PaintShadow[] {
  if (mode === 0) {
    return [];
  }

  const shadows = getAllPaintDropShadows(paint);
  if (mode === 1) {
    return shadows.slice(0, 1);
  }

  return shadows;
}

export function getLayerLayoutStyle(layer: PaintLayerData): ViewStyle {
  if (!layer.at && !layer.size) {
    return StyleSheet.absoluteFill;
  }

  // CSS background-position percentage semantics: a position of p% aligns
  // the p% point of the layer with the p% point of the container, i.e.
  // offset = (container - layer) * p.
  const sizeX = layer.size?.[0] ?? 1;
  const sizeY = layer.size?.[1] ?? 1;
  const posX = layer.at?.[0] ?? 0;
  const posY = layer.at?.[1] ?? 0;

  return {
    position: 'absolute',
    left: `${(1 - sizeX) * posX * 100}%`,
    top: `${(1 - sizeY) * posY * 100}%`,
    width: `${sizeX * 100}%`,
    height: `${sizeY * 100}%`,
    overflow: 'hidden',
  };
}

function solidGradientConfig(color: string): LayerGradientConfig {
  return {
    colors: [color, color],
    locations: [0, 1],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  };
}

/**
 * Repeating CSS gradients tile the stop span in both directions while keeping
 * the stops' absolute phase (a span of [0.4, 0.6] produces tiles at
 * ..., [0.0, 0.2], [0.2, 0.4], [0.4, 0.6], [0.6, 0.8], ...). react-native-svg
 * has no native spreadMethod support, so expand the pattern to cover [0, 1].
 */
function expandRepeatingStops(stops: PaintStop[]): PaintStop[] {
  if (stops.length === 0) {
    return stops;
  }

  const sorted = stops.slice().sort((a, b) => a.at - b.at);
  const firstAt = sorted[0]?.at ?? 0;
  const lastAt = sorted[sorted.length - 1]?.at ?? 1;
  const period = lastAt - firstAt;

  if (period <= 0.0001) {
    return sorted;
  }

  const expanded: PaintStop[] = [];
  const epsilon = 0.0001;
  const startTile = Math.floor((0 - firstAt) / period);

  for (let tile = startTile; firstAt + tile * period < 1; tile += 1) {
    const offset = tile * period;
    for (const stop of sorted) {
      const at = stop.at + offset;
      if (at < -epsilon || at > 1 + epsilon) {
        continue;
      }
      expanded.push({ at: Math.min(Math.max(at, 0), 1), color: stop.color });
    }
  }

  if (expanded.length === 0) {
    return sorted;
  }

  const first = expanded[0];
  if (first && first.at > 0) {
    expanded.unshift({ at: 0, color: first.color });
  }
  const last = expanded[expanded.length - 1];
  if (last && last.at < 1) {
    expanded.push({ at: 1, color: last.color });
  }

  return expanded;
}

// Keyed on the (memoised, stable) layer object, then on fallbackColor — the
// only per-call input. Repeating-gradient stop expansion + sorting + colour
// conversion are the heaviest paint work; sharing the result across every user
// wearing the paint is the main per-render saving.
const layerGradientConfigCache = new WeakMap<
  PaintLayerData,
  Map<string, LayerGradientConfig>
>();

export function buildLayerGradientConfig(
  layer: PaintLayerData,
  fallbackColor: string,
): LayerGradientConfig {
  let byFallback = layerGradientConfigCache.get(layer);
  if (!byFallback) {
    byFallback = new Map();
    layerGradientConfigCache.set(layer, byFallback);
  }
  const cached = byFallback.get(fallbackColor);
  if (cached) {
    return cached;
  }
  const config = computeLayerGradientConfig(layer, fallbackColor);
  byFallback.set(fallbackColor, config);
  return config;
}

function computeLayerGradientConfig(
  layer: PaintLayerData,
  fallbackColor: string,
): LayerGradientConfig {
  if (layer.function === 'URL' || !layer.stops || layer.stops.length === 0) {
    return solidGradientConfig(fallbackColor);
  }

  let stops = indexedCollectionToArray<PaintStop>(layer.stops)
    .slice()
    .sort((a, b) => a.at - b.at);
  if (layer.repeat) {
    stops = expandRepeatingStops(stops);
  }

  const gradientColors = stops.map(stop => sevenTvColorToCss(stop.color));

  if (gradientColors.length < 2) {
    return solidGradientConfig(gradientColors[0] || fallbackColor);
  }

  const points = angleToPoints(layer.angle || 0);

  return {
    colors: gradientColors,
    locations: stops.map(stop => stop.at),
    start: points.start,
    end: points.end,
  };
}

/**
 * True when the layer's texture is meant to tile across the paint area
 * (CSS `background-repeat` semantics) rather than stretch to fill it.
 */
export function isTilingCanvasRepeat(
  canvasRepeat: PaintCanvasRepeat,
  layerRepeat: boolean,
): boolean {
  return (
    layerRepeat ||
    canvasRepeat === 'repeat' ||
    canvasRepeat === 'repeat-x' ||
    canvasRepeat === 'repeat-y' ||
    canvasRepeat === 'round' ||
    canvasRepeat === 'space'
  );
}

export function imageRepeatFromCanvasRepeat(
  canvasRepeat: PaintCanvasRepeat,
  layerRepeat: boolean,
): 'cover' | 'contain' | 'fill' | 'none' | 'scale-down' {
  return isTilingCanvasRepeat(canvasRepeat, layerRepeat) ? 'none' : 'fill';
}

export type PaintLayerTileMode = 'clamp' | 'decal' | 'mirror' | 'repeat';

/**
 * Skia x/y tile modes for a tiling layer's `canvas_repeat`. `repeat-x` /
 * `repeat-y` tile one axis and clamp-to-transparent (`decal`) on the other;
 * everything else tiles both axes. `round`/`space` stretch or pad tiles in CSS,
 * but plain repetition is the closest Skia equivalent and matches how the
 * texture is meant to fill.
 */
export function paintLayerTileModes(canvasRepeat: PaintCanvasRepeat): {
  tx: PaintLayerTileMode;
  ty: PaintLayerTileMode;
} {
  switch (canvasRepeat) {
    case 'repeat-x':
      return { tx: 'repeat', ty: 'decal' };
    case 'repeat-y':
      return { tx: 'decal', ty: 'repeat' };
    default:
      return { tx: 'repeat', ty: 'repeat' };
  }
}
