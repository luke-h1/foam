import { SevenTvColor } from '@app/types/seventv/cosmetics';

import { sevenTvColorToRgba } from './sevenTvColorToRgba';

/**
 * A 7TV packed 32-bit RGBA integer as a CSS rgba() string; alpha is
 * normalised from 0-255 to 0-1.
 */
export function sevenTvColorToCss(color: SevenTvColor): string {
  const { r, g, b, a } = sevenTvColorToRgba(color);
  return `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
}
