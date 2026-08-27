import { indexedCollectionToArray } from '@app/services/ws/util/indexedCollection';
import type { PaintLayerData, PaintStop } from '@app/types/seventv/cosmetics';
import { sevenTvColorToCss } from '@app/utils/color/sevenTvColorToCss';

import { angleToPoints } from '../angleToPoints';
import { cssClampedStops } from './cssClampedStops';

export interface LayerGradientConfig {
  colors: string[];
  locations: number[];
  start: { x: number; y: number };
  end: { x: number; y: number };
}

/**
 * Expand repeating-gradient stops across [0, 1] (no SVG spreadMethod).
 * Keeps absolute stop phase (e.g. [0.4, 0.6] tiles at 0.2-0.4, 0.4-0.6, ...).
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

// Keyed on the stable layer object; stop expansion + colour conversion are
// the heaviest paint work, so share the result across users wearing the paint.
const layerGradientConfigCache = new WeakMap<
  PaintLayerData,
  { config: LayerGradientConfig | null }
>();

/**
 * Gradient config for a layer span, or null when the layer draws no gradient
 * (URL layers, and gradients with fewer than two stops).
 */
export function buildLayerGradientConfig(
  layer: PaintLayerData,
): LayerGradientConfig | null {
  const cached = layerGradientConfigCache.get(layer);
  if (cached) {
    return cached.config;
  }
  const config = computeLayerGradientConfig(layer);
  layerGradientConfigCache.set(layer, { config });
  return config;
}

function computeLayerGradientConfig(
  layer: PaintLayerData,
): LayerGradientConfig | null {
  if (layer.function === 'URL') {
    return null;
  }

  let stops = cssClampedStops(indexedCollectionToArray<PaintStop>(layer.stops));
  if (layer.repeat) {
    stops = expandRepeatingStops(stops);
  }

  if (stops.length < 2) {
    return null;
  }

  const points = angleToPoints(layer.angle || 0);

  return {
    colors: stops.map(stop => sevenTvColorToCss(stop.color)),
    locations: stops.map(stop => stop.at),
    start: points.start,
    end: points.end,
  };
}
