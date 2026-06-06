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

export function paintShadowToTextStyle(shadow: PaintShadow) {
  return {
    textShadowColor: sevenTvColorToCss(shadow.color),
    textShadowOffset: {
      width: shadow.x_offset || 0,
      height: shadow.y_offset || 0,
    },
    textShadowRadius: shadow.radius || 0,
  };
}

export function getLayerLayoutStyle(layer: PaintLayerData): ViewStyle {
  if (!layer.at && !layer.size) {
    return StyleSheet.absoluteFill;
  }

  const widthPct = (layer.size?.[0] ?? 1) * 100;
  const heightPct = (layer.size?.[1] ?? 1) * 100;
  const anchorX = layer.at?.[0] ?? 0.5;
  const anchorY = layer.at?.[1] ?? 0.5;

  return {
    position: 'absolute',
    left: `${anchorX * 100}%`,
    top: `${anchorY * 100}%`,
    width: `${widthPct}%`,
    height: `${heightPct}%`,
    transform: [{ translateX: '-50%' }, { translateY: '-50%' }],
    overflow: 'hidden',
  };
}

function expandRepeatingStops(stops: PaintStop[]): PaintStop[] {
  if (stops.length === 0) {
    return stops;
  }

  const sorted = stops.slice().sort((a, b) => a.at - b.at);
  const firstAt = sorted[0]?.at ?? 0;
  const lastAt = sorted[sorted.length - 1]?.at ?? 1;
  const period = Math.max(lastAt - firstAt, 0.0001);
  const expanded: PaintStop[] = [];

  for (let offset = 0; offset < 1; offset += period) {
    for (const stop of sorted) {
      const at = offset + (stop.at - firstAt);
      if (at > 1 + 0.0001) {
        break;
      }
      expanded.push({
        at: Math.min(at, 1),
        color: stop.color,
      });
    }
  }

  if (expanded.length === 0) {
    return sorted;
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
    const solidColor = fallbackColor;
    return {
      colors: [solidColor, solidColor],
      locations: [0, 1],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 0 },
    };
  }

  let stops = indexedCollectionToArray<PaintStop>(layer.stops).slice();
  if (layer.repeat) {
    stops = expandRepeatingStops(stops);
  }

  const sortedStops = stops.sort((a, b) => a.at - b.at);
  const gradientColors = sortedStops.map(stop => sevenTvColorToCss(stop.color));
  const gradientLocations = sortedStops.map(stop => stop.at);

  if (gradientColors.length < 2) {
    const color = gradientColors[0] || fallbackColor;
    return {
      colors: [color, color],
      locations: [0, 1],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 0 },
    };
  }

  const points = angleToPoints(layer.angle || 0);

  return {
    colors: gradientColors,
    locations: gradientLocations,
    start: points.start,
    end: points.end,
  };
}

export function imageRepeatFromCanvasRepeat(
  canvasRepeat: PaintCanvasRepeat,
  layerRepeat: boolean,
): 'cover' | 'contain' | 'fill' | 'none' | 'scale-down' {
  if (canvasRepeat === 'no-repeat' || canvasRepeat === '') {
    return 'cover';
  }

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

  return 'cover';
}
