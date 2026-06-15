import { indexedCollectionToArray } from '@app/services/ws/util/indexedCollection';
import { sevenTvColorToCss } from '@app/utils/color/sevenTvColorToCss';
import type {
  PaintCanvasRepeat,
  PaintData,
  PaintLayerData,
  PaintShadow,
  PaintStop,
} from '@app/utils/color/seventv-ws-service';
import { StyleSheet, type ViewStyle } from 'react-native';
import { angleToPoints } from './angleToPoints';

export interface LayerGradientConfig {
  colors: string[];
  locations: number[];
  start: { x: number; y: number };
  end: { x: number; y: number };
}

export function getPaintLayers(paint: PaintData): PaintLayerData[] {
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

export type PaintDropShadowMode = 0 | 1 | 2;

export const DEFAULT_PAINT_DROP_SHADOW_MODE = 1 as const;

export function getPaintDropShadows(
  paint: PaintData,
  mode: PaintDropShadowMode = DEFAULT_PAINT_DROP_SHADOW_MODE,
): PaintShadow[] {
  if (mode === 0) {
    return [];
  }

  const shadows = indexedCollectionToArray(paint.shadows);
  if (mode === 2) {
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

export function buildLayerGradientConfig(
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

export function imageRepeatFromCanvasRepeat(
  canvasRepeat: PaintCanvasRepeat,
  layerRepeat: boolean,
): 'cover' | 'contain' | 'fill' | 'none' | 'scale-down' {
  if (
    layerRepeat ||
    canvasRepeat === 'repeat' ||
    canvasRepeat === 'repeat-x' ||
    canvasRepeat === 'repeat-y' ||
    canvasRepeat === 'round' ||
    canvasRepeat === 'space'
  ) {
    return 'none';
  }

  return 'fill';
}
