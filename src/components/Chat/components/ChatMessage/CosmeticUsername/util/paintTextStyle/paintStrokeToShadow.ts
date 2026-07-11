import type {
  PaintShadow,
  PaintTextStroke,
} from '@app/types/seventv/cosmetics';

/**
 * Approximates -webkit-text-stroke with a same-position glyph copy in the
 * stroke color, blurred outward by the stroke width.
 */
export function paintStrokeToShadow(stroke: PaintTextStroke): PaintShadow {
  return {
    color: stroke.color,
    radius: stroke.width,
    x_offset: 0,
    y_offset: 0,
  };
}
