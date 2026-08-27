import { SevenTvColor } from '@app/types/seventv/cosmetics';

import { sevenTvColorToRgba } from './sevenTvColorToRgba';

/**
 * A fully transparent 7TV colour is a real value, so a caller treating only
 * `null` as "no colour" would paint alpha 0 and draw nothing.
 */
export function isVisibleSevenTvColor(
  color: SevenTvColor | null | undefined,
): color is SevenTvColor {
  return color != null && sevenTvColorToRgba(color).a > 0;
}
