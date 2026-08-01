import type { PaintStop } from '@app/types/seventv/cosmetics';

/**
 * CSS keeps colour stops in written order and clamps each position to the
 * running maximum so far (css-images-3 §3.4.2) - it never reorders them - so
 * an out-of-order stop becomes a hard transition exactly as the browser
 * renders the reference CSS.
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
