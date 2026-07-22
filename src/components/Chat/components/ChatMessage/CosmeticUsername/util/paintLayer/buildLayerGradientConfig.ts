import { indexedCollectionToArray } from '@app/services/ws/util/indexedCollection';
import type { PaintLayerData, PaintStop } from '@app/types/seventv/cosmetics';
import { sevenTvColorToCss } from '@app/utils/color/sevenTvColorToCss';

import { angleToPoints } from '../angleToPoints';

export interface LayerGradientConfig {
  colors: string[];
  locations: number[];
  start: { x: number; y: number };
  end: { x: number; y: number };
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
 * Expand repeating-gradient stops across [0, 1] (no SVG spreadMethod).
 * Keeps absolute stop phase (e.g. [0.4, 0.6] tiles at …, 0.2–0.4, 0.4–0.6, …).
 */
function expandRepeatingStops(stops: PaintStop[]): PaintStop[] {
  if (stops.length === 0) {
    return stops;
  }

  const sorted = stops.toSorted((a, b) => a.at - b.at);
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

/**
 * Keyed on the (memoised, stable) layer object, then on fallbackColor - the
 * only per-call input. Repeating-gradient stop expansion + sorting + colour
 * conversion are the heaviest paint work; sharing the result across every user
 * wearing the paint is the main per-render saving.
 */
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
