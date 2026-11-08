import type { SevenTvColor } from '@app/types/seven-tv/cosmetics';

export interface SevenTvRgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

export function sevenTvColorToRgba(color: SevenTvColor): SevenTvRgba {
  const r = (color >>> 24) & 0xff;

  const g = (color >>> 16) & 0xff;

  const b = (color >>> 8) & 0xff;

  const a = color & 0xff;

  return { r, g, b, a };
}
