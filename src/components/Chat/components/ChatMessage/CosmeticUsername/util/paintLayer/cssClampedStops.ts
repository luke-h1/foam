import type { PaintStop } from '@app/types/seventv/cosmetics';

/**
 * CSS clamps each stop to the running maximum, never reordering (css-images-3
 * §3.4.2), so an out-of-order stop becomes a hard transition as in the browser.
 */
export function cssClampedStops(stops: PaintStop[]): PaintStop[] {
  let runningMax = Number.NEGATIVE_INFINITY;
  return stops.map(stop => {
    runningMax = Math.max(runningMax, stop.at);
    return runningMax === stop.at
      ? stop
      : { at: runningMax, color: stop.color };
  });
}
