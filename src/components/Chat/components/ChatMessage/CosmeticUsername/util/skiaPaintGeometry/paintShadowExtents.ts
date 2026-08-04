import type { PaintShadow } from '@app/types/seventv/cosmetics';

import { cssDropShadowSigma } from './cssDropShadowSigma';
import { cssTextShadowSigma } from './cssTextShadowSigma';

export interface ShadowExtents {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

// A Gaussian's visible falloff is ~3 standard deviations.
const BLUR_EXTENT_SIGMAS = 3;

/**
 * How far outside the glyph box a paint's shadows can reach, in CSS px, so the
 * bitmap is padded enough to hold them.
 *
 * `text-shadow`s are drawn independently of each other, so each one only has to
 * fit on its own. Chained `drop-shadow()`s nest - shadow k is cast by the
 * filter output that already holds shadows 1..k-1 - so they sit at the running
 * offset and their blurs combine in quadrature. Summing the radii instead would
 * over-allocate the surface ~3x on the paints that chain eight shadows.
 */
export function paintShadowExtents(
  dropShadows: PaintShadow[],
  textShadows: PaintShadow[],
  strokeWidth: number,
): ShadowExtents {
  const extents: ShadowExtents = {
    left: strokeWidth,
    top: strokeWidth,
    right: strokeWidth,
    bottom: strokeWidth,
  };

  for (const shadow of textShadows) {
    const blur = BLUR_EXTENT_SIGMAS * cssTextShadowSigma(shadow.radius);
    extents.left = Math.max(extents.left, blur - shadow.x_offset);
    extents.right = Math.max(extents.right, blur + shadow.x_offset);
    extents.top = Math.max(extents.top, blur - shadow.y_offset);
    extents.bottom = Math.max(extents.bottom, blur + shadow.y_offset);
  }

  let variance = 0;
  let offsetX = 0;
  let offsetY = 0;
  for (const shadow of dropShadows) {
    const sigma = cssDropShadowSigma(shadow.radius);
    variance += sigma * sigma;
    offsetX += shadow.x_offset;
    offsetY += shadow.y_offset;
    const reach = BLUR_EXTENT_SIGMAS * Math.sqrt(variance);
    extents.left = Math.max(extents.left, reach - offsetX);
    extents.right = Math.max(extents.right, reach + offsetX);
    extents.top = Math.max(extents.top, reach - offsetY);
    extents.bottom = Math.max(extents.bottom, reach + offsetY);
  }

  return extents;
}
