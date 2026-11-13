/**
 * Montserrat's OS/2 strikeout metrics in em: yStrikeoutPosition 323 and
 * yStrikeoutSize 50 at 1000 units per em. CoreText draws `line-through` from
 * the same table, so the Skia line sits where the text fallback draws it.
 */
const STRIKEOUT_OFFSET_EM = 0.323;
const STRIKEOUT_THICKNESS_EM = 0.05;

export interface StrikeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface StrikeRectOptions {
  fontSizePx: number;
  baselinePx: number;
  glyphWidthPx: number;
  originX: number;
  originY: number;
}

/**
 * The `line-through` band across the whole name, in surface pixels. It is
 * never thinner than one pixel.
 */
export function strikeRect({
  fontSizePx,
  baselinePx,
  glyphWidthPx,
  originX,
  originY,
}: StrikeRectOptions): StrikeRect {
  const height = Math.max(1, fontSizePx * STRIKEOUT_THICKNESS_EM);

  return {
    x: originX,
    y: originY + baselinePx - fontSizePx * STRIKEOUT_OFFSET_EM - height / 2,
    width: glyphWidthPx,
    height,
  };
}
