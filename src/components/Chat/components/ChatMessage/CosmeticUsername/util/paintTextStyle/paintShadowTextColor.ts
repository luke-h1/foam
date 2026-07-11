import type { PaintShadow } from '@app/types/seventv/cosmetics';
import { sevenTvColorToCss } from '@app/utils/color/sevenTvColorToCss';

export function paintShadowTextColor(shadow: PaintShadow): string {
  return sevenTvColorToCss(shadow.color);
}
