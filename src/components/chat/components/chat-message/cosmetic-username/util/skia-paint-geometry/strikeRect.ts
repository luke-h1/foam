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
