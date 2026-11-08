import type { PaintData } from '@app/types/seven-tv/cosmetics';
import { isVisibleSevenTvColor } from '@app/utils/color/isVisibleSevenTvColor';
import { sevenTvColorToCss } from '@app/utils/color/sevenTvColorToCss';

export function getPaintBaseColor(paint: PaintData, fallback: string): string {
  return isVisibleSevenTvColor(paint.color)
    ? sevenTvColorToCss(paint.color)
    : fallback;
}
