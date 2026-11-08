import type { SevenTvColor } from '@app/types/seven-tv/cosmetics';

import { sevenTvColorToRgba } from './sevenTvColorToRgba';

export function sevenTvColorToCss(color: SevenTvColor): string {
  const { r, g, b, a } = sevenTvColorToRgba(color);
  return `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
}
