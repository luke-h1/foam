import type { PaintShadow } from '@app/types/seventv/cosmetics';

import { cssDropShadowBlur } from './cssDropShadowBlur';
import { cssTextShadowBlur } from './cssTextShadowBlur';

export interface ShadowExtents {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

// A Gaussian blur fades out at about three times its blur value.
const BLUR_EXTENT_MULTIPLE = 3;

/**
 * Above this the subset walk is not worth it; 7TV paints top out around eight
 * chained shadows, and the running-total bound below is still safe, just
 * slightly generous.
 */
const MAX_ENUMERATED_DROP_SHADOWS = 12;

/**
 * `filter: drop-shadow(a) drop-shadow(b)` makes b shadow a's whole output -
 * source included - so the composite is the union of every subset of the
 * chain: the glyph, a's shadow, b's shadow, and b's shadow of a's. Padding has
 * to cover the furthest-reaching subset, not just the fully-cumulative one; a
 * chain whose first shadow is offset far right would otherwise report no left
 * extent at all and clip a later, wider shadow that sits back at the origin.
 */
function* dropShadowSubsets(
  dropShadows: PaintShadow[],
): Generator<PaintShadow[]> {
  if (dropShadows.length > MAX_ENUMERATED_DROP_SHADOWS) {
    yield dropShadows;
    return;
  }

  for (let mask = 1; mask < 1 << dropShadows.length; mask += 1) {
    const subset: PaintShadow[] = [];
    for (let index = 0; index < dropShadows.length; index += 1) {
      if (mask & (1 << index)) {
        subset.push(dropShadows[index]!);
      }
    }
    yield subset;
  }
}

/**
 * How far outside the glyph box a paint's shadows can reach, in CSS px, so the
 * bitmap is padded enough to hold them.
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
    const blur = BLUR_EXTENT_MULTIPLE * cssTextShadowBlur(shadow.radius);
    extents.left = Math.max(extents.left, blur - shadow.x_offset);
    extents.right = Math.max(extents.right, blur + shadow.x_offset);
    extents.top = Math.max(extents.top, blur - shadow.y_offset);
    extents.bottom = Math.max(extents.bottom, blur + shadow.y_offset);
  }

  for (const subset of dropShadowSubsets(dropShadows)) {
    let squaredBlur = 0;
    let offsetX = 0;
    let offsetY = 0;

    for (const shadow of subset) {
      const blur = cssDropShadowBlur(shadow.radius);
      squaredBlur += blur * blur;
      offsetX += shadow.x_offset;
      offsetY += shadow.y_offset;
    }

    const reach = BLUR_EXTENT_MULTIPLE * Math.sqrt(squaredBlur);
    extents.left = Math.max(extents.left, reach - offsetX);
    extents.right = Math.max(extents.right, reach + offsetX);
    extents.top = Math.max(extents.top, reach - offsetY);
    extents.bottom = Math.max(extents.bottom, reach + offsetY);
  }

  return extents;
}
