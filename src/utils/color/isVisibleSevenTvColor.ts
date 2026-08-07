import { SevenTvColor } from '@app/types/seventv/cosmetics';

import { sevenTvColorToRgba } from './sevenTvColorToRgba';

/**
 * A fully transparent 7TV colour is a real value rather than an absent one, so
 * a caller that treats only `null` as "no colour" paints `rgba(r, g, b, 0)` and
 * draws nothing.
 */
export function isVisibleSevenTvColor(
  color: SevenTvColor | null | undefined,
): color is SevenTvColor {
  return color != null && sevenTvColorToRgba(color).a > 0;
}
