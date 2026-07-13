import { SevenTvColor } from '@app/types/seventv/cosmetics';

import { sevenTvColorToRgba } from './sevenTvColorToRgba';

/**
 * Alpha is normalized from 0–255 to 0–1 for CSS.
 */
export function sevenTvColorToCss(color: SevenTvColor): string {
  const { r, g, b, a } = sevenTvColorToRgba(color);
  return `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
}
