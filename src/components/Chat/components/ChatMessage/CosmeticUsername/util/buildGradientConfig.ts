import { indexedCollectionToArray } from '@app/services/ws/util/indexedCollection';
import { sevenTvColorToCss } from '@app/utils/color/sevenTvColorToCss';
import { PaintData, PaintStop } from '@app/utils/color/seventv-ws-service';
import { angleToPoints } from './angleToPoints';

export interface GradientConfig {
  colors: string[];
  locations: number[];
  start: { x: number; y: number };
  end: { x: number; y: number };
}

/**
 * Build gradient configuration from paint data
 */
export function buildGradientConfig(
  paint: PaintData,
  fallbackColor: string,
): GradientConfig {
  // Handle URL paints or empty stops - use solid color
  if (paint.function === 'URL' || !paint.stops || paint.stops.length === 0) {
    const solidColor =
      paint.color !== null ? sevenTvColorToCss(paint.color) : fallbackColor;
    return {
      colors: [solidColor, solidColor],
      locations: [0, 1],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 0 },
    };
  }

  const stops = indexedCollectionToArray<PaintStop>(paint.stops);
  const sortedStops = [...stops].sort((a, b) => a.at - b.at);

  const gradientColors = sortedStops.map(stop => sevenTvColorToCss(stop.color));
  const gradientLocations = sortedStops.map(stop => stop.at);

  // Need at least 2 stops for a gradient
  if (gradientColors.length < 2) {
    const color = gradientColors[0] || fallbackColor;
    return {
      colors: [color, color],
      locations: [0, 1],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 0 },
    };
  }

  const points = angleToPoints(paint.angle || 0);

  return {
    colors: gradientColors,
    locations: gradientLocations,
    start: points.start,
    end: points.end,
  };
}
